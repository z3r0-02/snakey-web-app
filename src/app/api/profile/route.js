import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

export async function PUT(request) {
  try {
    const { userId, gender, dob, country } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    const db = await initDb();

    // Verify user exists
    const userRes = await db.execute({
      sql: "SELECT id FROM users WHERE id = ? OR username = ? OR email = ?",
      args: [userId, userId, userId],
    });

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const actualUserId = userRes.rows[0].id;

    // Update fields
    await db.execute({
      sql: "UPDATE users SET gender = ?, dob = ?, country = ? WHERE id = ?",
      args: [gender, dob, country, actualUserId],
    });

    // Fetch the updated user row to return to client so they can update localStorage
    const updatedRes = await db.execute({
      sql: "SELECT id, first_name, last_name, email, username, gender, dob, country, avatar FROM users WHERE id = ?",
      args: [actualUserId],
    });

    if (updatedRes.rows.length === 0) {
      return NextResponse.json({ error: "Failed to fetch updated user." }, { status: 500 });
    }

    const row = updatedRes.rows[0];
    const user = {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      name: `${row.first_name} ${row.last_name}`,
      email: row.email,
      username: row.username,
      gender: row.gender,
      dob: row.dob,
      country: row.country,
      avatar: row.avatar,
    };

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Profile PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
