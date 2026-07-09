import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { mapUserRow, userLookup } from "@/lib/user";

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

    await db.execute({
      sql: `UPDATE users SET ${dbColumn} = ? WHERE ${lookup.column} = ?`,
      args: [value, lookup.value],
    });

    // Return the updated user object
    const userRes = await db.execute({
      sql: `SELECT * FROM users WHERE ${lookup.column} = ?`,
      args: [lookup.value],
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
