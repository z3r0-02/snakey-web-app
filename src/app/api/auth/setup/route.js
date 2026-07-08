import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { mapUserRow } from "@/lib/user";

export async function POST(request) {
  try {
    const { email, username, avatar } = await request.json();

    if (!email || !username) {
      return NextResponse.json(
        { error: "Email and username are required." },
        { status: 400 }
      );
    }

    // Validate username format
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: "Username must be between 3 and 20 characters." },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and underscores." },
        { status: 400 }
      );
    }

    const db = await initDb();

    // Check if username is already taken (by a different user)
    const taken = await db.execute({
      sql: "SELECT id FROM users WHERE username = ? AND email != ?",
      args: [username, email],
    });

    if (taken.rows.length > 0) {
      return NextResponse.json(
        { error: "This username is already taken." },
        { status: 409 }
      );
    }

    // Update user
    await db.execute({
      sql: "UPDATE users SET username = ?, avatar = ? WHERE email = ?",
      args: [username, avatar || null, email],
    });

    // Fetch updated user
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully!",
      user: mapUserRow(result.rows[0]),
    });
  } catch (err) {
    console.error("Setup error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
