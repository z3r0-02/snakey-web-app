import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initDb } from "@/lib/db";
import { isValidEmail, getPasswordError } from "@/lib/validation";

export async function POST(request) {
  try {
    const { firstName, lastName, email, gender, dob, country, password } =
      await request.json();

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "First name, last name, email, and password are required." },
        { status: 400 }
      );
    }

    const passwordError = getPasswordError(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const db = await initDb();

    // Check for duplicate email
    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [email],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const name = `${firstName} ${lastName}`.trim();
    const result = await db.execute({
      sql: `INSERT INTO users (first_name, last_name, email, gender, dob, country, password)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [firstName, lastName, email, gender || null, dob || null, country || null, hashedPassword],
    });

    return NextResponse.json(
      {
        message: "Account created successfully!",
        user: {
          id: Number(result.lastInsertRowid),
          name,
          firstName,
          lastName,
          email,
          gender,
          dob,
          country,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
