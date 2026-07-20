import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initDb } from "@/lib/db";
import { getPasswordError, RESET_TOKEN_ERROR_CODES } from "@/lib/validation";
import { BCRYPT_SALT_ROUNDS } from "@/lib/constants";

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: RESET_TOKEN_ERROR_CODES.MISSING_FIELDS },
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
        { error: RESET_TOKEN_ERROR_CODES.INVALID_TOKEN },
        { status: 400 }
      );
    }

    const row = result.rows[0];

    // Check if already used
    if (row.used) {
      return NextResponse.json(
        { error: RESET_TOKEN_ERROR_CODES.ALREADY_USED },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date(row.expires_at) < new Date()) {
      return NextResponse.json(
        { error: RESET_TOKEN_ERROR_CODES.EXPIRED },
        { status: 400 }
      );
    }

    // Hash the new password and update the user
    const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

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
