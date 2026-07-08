import { NextResponse } from "next/server";
import client, { initDb } from "@/lib/db";
import { mapUserRow } from "@/lib/user";

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

    let sql = "";
    if (type === "title") {
      sql = `UPDATE users SET active_title = ? WHERE id = ? OR username = ? OR email = ?`;
    } else if (type === "color") {
      sql = `UPDATE users SET active_snake_color = ? WHERE id = ? OR username = ? OR email = ?`;
    } else {
      return NextResponse.json({ error: "Invalid type." }, { status: 400 });
    }

    await db.execute({
      sql,
      args: [value, userId, userId, userId],
    });

    // Return the updated user object
    const userRes = await db.execute({
      sql: `SELECT * FROM users WHERE id = ? OR username = ? OR email = ?`,
      args: [userId, userId, userId],
    });

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ user: mapUserRow(userRes.rows[0]) }, { status: 200 });
  } catch (error) {
    console.error("Equip Profile Error:", error);
    return NextResponse.json(
      { error: "Failed to equip item" },
      { status: 500 }
    );
  }
}
