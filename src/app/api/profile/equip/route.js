import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { mapUserRow, userLookup } from "@/lib/user";
import { ACHIEVEMENTS, THEMES } from "@/lib/achievements";

function ownsItem(type, value, unlockedIds) {
  if (type === "color") {
    if (value === "default") return true;
    if (!THEMES[value]) return false;
    if (unlockedIds.has(value)) return true;
    return ACHIEVEMENTS.some(
      (a) =>
        unlockedIds.has(a.id) &&
        (a.rewardType === "color" || a.rewardType === "both") &&
        a.rewardValue === value
    );
  }
  return ACHIEVEMENTS.some(
    (a) =>
      unlockedIds.has(a.id) &&
      ((a.rewardType === "title" && a.rewardValue === value) ||
        (a.rewardType === "both" && a.rewardValue2 === value))
  );
}

export async function PUT(request) {
  try {
    const db = await initDb();
    const { userId, type, value } = await request.json();

    if (!userId || !type || value === undefined) {
      return NextResponse.json(
        { error: "userId, type, and value are required." },
        { status: 400 }
      );
    }

    let dbColumn = "";
    if (type === "title") {
      dbColumn = "active_title";
    } else if (type === "color") {
      dbColumn = "active_snake_color";
    } else {
      return NextResponse.json({ error: "Invalid type." }, { status: 400 });
    }

    // Match only the column the identifier belongs to (id / username / email).
    const lookup = userLookup(userId);
    const userRes = await db.execute({
      sql: `SELECT * FROM users WHERE ${lookup.column} = ?`,
      args: [lookup.value],
    });

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    const userRow = userRes.rows[0];

    // Only allow equipping items the user has actually unlocked.
    const achRes = await db.execute({
      sql: "SELECT achievement_id FROM user_achievements WHERE user_id = ?",
      args: [userRow.id],
    });
    const unlockedIds = new Set(achRes.rows.map((r) => r.achievement_id));

    if (!ownsItem(type, value, unlockedIds)) {
      return NextResponse.json(
        { error: "Item not unlocked." },
        { status: 403 }
      );
    }

    await db.execute({
      sql: `UPDATE users SET ${dbColumn} = ? WHERE id = ?`,
      args: [value, userRow.id],
    });

    // Return the updated user object
    const updatedRes = await db.execute({
      sql: "SELECT * FROM users WHERE id = ?",
      args: [userRow.id],
    });

    return NextResponse.json({ user: mapUserRow(updatedRes.rows[0]) }, { status: 200 });
  } catch (error) {
    console.error("Equip Profile Error:", error);
    return NextResponse.json(
      { error: "Failed to equip item" },
      { status: 500 }
    );
  }
}
