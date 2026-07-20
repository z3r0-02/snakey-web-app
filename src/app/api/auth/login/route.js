import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initDb } from "@/lib/db";
import { mapUserRow } from "@/lib/user";
import { enforceRateLimit } from "@/lib/rateLimit";
import { AUTH_ERROR_CODES } from "@/lib/validation";

export async function POST(request) {
  const limited = enforceRateLimit(request, "login", { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: AUTH_ERROR_CODES.LOGIN_MISSING_FIELDS },
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
        { error: AUTH_ERROR_CODES.LOGIN_INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: AUTH_ERROR_CODES.LOGIN_INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    // Return user without password (mapUserRow drops it)
    return NextResponse.json(
      {
        message: "Login successful! Redirecting…",
        user: mapUserRow(user),
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
