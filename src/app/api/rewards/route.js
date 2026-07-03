import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { GLOWING_COLORS } from "@/lib/achievements";

export async function POST(request) {
  try {
    const { userId, date, finalScore } = await request.json();

    if (!userId || !date) {
      return NextResponse.json({ error: "userId and date are required" }, { status: 400 });
    }

    const db = await initDb();

    // Verify they actually used 3 attempts
    const attemptsRes = await db.execute({
      sql: "SELECT used FROM attempts WHERE user_id = ? AND date = ?",
      args: [userId, date],
    });

    if (attemptsRes.rows.length === 0 || attemptsRes.rows[0].used < 3) {
      return NextResponse.json({ success: false, reason: "not_enough_attempts" });
    }

    // Must have scored >= 400 today (either in a previous run today, or this exact run)
    const scoreRes = await db.execute({
      sql: "SELECT MAX(score) as best FROM scores WHERE user_id = ? AND date(created_at) = date(?)",
      args: [userId, date],
    });

    const dbBestToday = scoreRes.rows.length > 0 ? scoreRes.rows[0].best : 0;
    const actualBestToday = Math.max(dbBestToday || 0, finalScore || 0);

    if (actualBestToday < 400) {
      return NextResponse.json({ success: false, reason: "score_too_low" });
    }

    // Get currently unlocked achievements
    const achRes = await db.execute({
      sql: "SELECT achievement_id FROM user_achievements WHERE user_id = ?",
      args: [userId],
    });
    
    const unlockedSet = new Set(achRes.rows.map(r => r.achievement_id));

    // Find available glowing colors
    const availableColors = GLOWING_COLORS.filter(colorId => !unlockedSet.has(colorId));

    if (availableColors.length === 0) {
      return NextResponse.json({ success: false, reason: "all_colors_unlocked" });
    }

    // Pick a random color
    const randomIndex = Math.floor(Math.random() * availableColors.length);
    const newColorId = availableColors[randomIndex];

    // Grant the achievement
    await db.execute({
      sql: "INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)",
      args: [userId, newColorId],
    });

    return NextResponse.json({ success: true, rewardId: newColorId });

  } catch (error) {
    console.error("Rewards POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
