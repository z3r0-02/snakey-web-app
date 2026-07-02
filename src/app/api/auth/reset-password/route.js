import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initDb } from "@/lib/db";
import { getPasswordError } from "@/lib/validation";

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and new password are required." },
        { status: 400 }
      );
    }

    const passwordError = getPasswordError(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const db = await initDb();

    // Fetch the token row
    const result = await db.execute({
      sql: "SELECT * FROM password_reset_tokens WHERE token = ?",
      args: [token],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "This reset link is invalid or has already been used." },
        { status: 400 }
      );
    }

    const row = result.rows[0];

    // Check if already used
    if (row.used) {
      return NextResponse.json(
        { error: "This reset link has already been used." },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date(row.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password and update the user
    const hashed = await bcrypt.hash(password, 10);

    await db.execute({
      sql: "UPDATE users SET password = ? WHERE id = ?",
      args: [hashed, row.user_id],
    });

    // Mark token as used
    await db.execute({
      sql: "UPDATE password_reset_tokens SET used = 1 WHERE id = ?",
      args: [row.id],
    });

    return NextResponse.json({ message: "Password updated successfully." }, { status: 200 });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
