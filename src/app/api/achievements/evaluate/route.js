import { NextResponse } from "next/server";
import client, { initDb } from "@/lib/db";
import { ACHIEVEMENTS } from "@/lib/achievements";

export async function POST(request) {
  try {
    const db = await initDb();
    const { userId, score, crashReason, date, activeColor } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }

    // 1. Fetch user's current unlocked achievements
    const achRes = await db.execute({
      sql: `SELECT achievement_id FROM user_achievements WHERE user_id = ?`,
      args: [userId],
    });
    const unlockedIds = new Set(achRes.rows.map((r) => r.achievement_id));

    // 2. Fetch stats: total days played
    const daysRes = await db.execute({
      sql: `SELECT COUNT(DISTINCT date) as days FROM attempts WHERE user_id = ?`,
      args: [userId],
    });
    const daysPlayed = daysRes.rows[0].days || 0;

    // 3. Fetch stats: best score for this user
    const bestRes = await db.execute({
      sql: `SELECT MAX(score) as best FROM scores WHERE user_id = ?`,
      args: [userId],
    });
    const bestScore = Math.max(score || 0, bestRes.rows[0].best || 0);

    // 4. Fetch stats: overall #1 score (to check if user beat it)
    const topRes = await db.execute(`SELECT MAX(score) as top_score FROM scores`);
    const overallTop = topRes.rows[0].top_score || 0;

    // 5. Fetch and update self_crashes
    let selfCrashes = 0;
    try {
      const userRes = await db.execute({
        sql: `SELECT self_crashes FROM users WHERE id = ?`,
        args: [userId],
      });
      selfCrashes = userRes.rows[0]?.self_crashes || 0;

      if (crashReason === "self") {
        selfCrashes += 1;
        await db.execute({
          sql: `UPDATE users SET self_crashes = ? WHERE id = ?`,
          args: [selfCrashes, userId],
        });
      }
    } catch (e) {
      console.error("Error fetching/updating self_crashes", e);
    }

    // 6. Evaluate un-unlocked achievements
    const newlyUnlocked = [];

    // Helper to unlock
    const unlock = async (id) => {
      if (!unlockedIds.has(id)) {
        newlyUnlocked.push(id);
        unlockedIds.add(id); // prevent duplicate unlocks in the same run
        
        await db.execute({
          sql: `INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)`,
          args: [userId, id],
        });

        // Unlock associated rewards automatically
        const achDef = ACHIEVEMENTS.find(a => a.id === id);
        if (achDef) {
          if (achDef.rewardValue && !unlockedIds.has(achDef.rewardValue)) {
            newlyUnlocked.push(achDef.rewardValue);
            unlockedIds.add(achDef.rewardValue);
            await db.execute({
              sql: `INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)`,
              args: [userId, achDef.rewardValue],
            });
          }
          if (achDef.rewardValue2 && !unlockedIds.has(achDef.rewardValue2)) {
            newlyUnlocked.push(achDef.rewardValue2);
            unlockedIds.add(achDef.rewardValue2);
            await db.execute({
              sql: `INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)`,
              args: [userId, achDef.rewardValue2],
            });
          }
        }
      }
    };

    // Evaluate conditions
    await unlock("first_game");

    if (score >= 50) await unlock("baby_steps");
    if (score > 250) await unlock("try_harder");
    if (score > 1000) await unlock("wizard");
    if (score > 2500) await unlock("cheating");
    if (score > 500) await unlock("holy_500");

    if (daysPlayed >= 3) await unlock("magical_3");
    if (daysPlayed >= 5) await unlock("five_days");
    if (daysPlayed >= 10) await unlock("10_days");
    if (daysPlayed >= 20) await unlock("20_days");

    if (crashReason === "self") await unlock("confused_potato");
    if (crashReason === "border") await unlock("nope_border");
    if (selfCrashes >= 3) await unlock("cannibal");

    if (activeColor === "black") await unlock("danger_lover");

    if (score > 0 && score >= overallTop) await unlock("damn_good");

    return NextResponse.json({ newlyUnlocked }, { status: 200 });
  } catch (error) {
    console.error("Evaluate Achievements Error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate achievements" },
      { status: 500 }
    );
  }
}
