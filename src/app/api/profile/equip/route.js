import { NextResponse } from "next/server";
import client, { initDb } from "@/lib/db";

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
      sql: `SELECT id, first_name, last_name, email, username, gender, dob, country, avatar, active_title, active_snake_color, created_at FROM users WHERE id = ? OR username = ? OR email = ?`,
      args: [userId, userId, userId],
    });

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updatedUser = userRes.rows[0];
    const userMap = {
      id: updatedUser.id,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      email: updatedUser.email,
      username: updatedUser.username,
      name: updatedUser.username || updatedUser.first_name,
      gender: updatedUser.gender,
      dob: updatedUser.dob,
      country: updatedUser.country,
      avatar: updatedUser.avatar,
      active_title: updatedUser.active_title,
      active_snake_color: updatedUser.active_snake_color,
      created_at: updatedUser.created_at,
    };

    return NextResponse.json({ user: userMap }, { status: 200 });
  } catch (error) {
    console.error("Equip Profile Error:", error);
    return NextResponse.json(
      { error: "Failed to equip item" },
      { status: 500 }
    );
  }
}
