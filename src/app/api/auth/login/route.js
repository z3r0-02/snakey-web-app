import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initDb } from "@/lib/db";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const db = await initDb();

    // Look up user by username
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE username = ?",
      args: [username],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    // Return user without password
    return NextResponse.json(
      {
        message: "Login successful! Redirecting…",
        user: {
          id: user.id,
          name: user.username || `${user.first_name} ${user.last_name}`.trim(),
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          gender: user.gender,
          dob: user.dob,
          country: user.country,
          avatar: user.avatar,
          active_title: user.active_title,
          active_snake_color: user.active_snake_color,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
