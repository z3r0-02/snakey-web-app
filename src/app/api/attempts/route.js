import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

// GET /api/attempts?userId=123&date=YYYY-MM-DD
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");

    if (!userId || !date) {
      return NextResponse.json(
        { error: "userId and date are required." },
        { status: 400 }
      );
    }

    const db = await initDb();

    const [usedResult, daysResult] = await Promise.all([
      db.execute({
        sql: "SELECT used FROM attempts WHERE user_id = ? AND date = ?",
        args: [userId, date],
      }),
      db.execute({
        sql: "SELECT COUNT(DISTINCT date) as totalDays FROM attempts WHERE user_id = ? AND used > 0",
        args: [userId],
      })
    ]);

    const used = usedResult.rows.length === 0 ? 0 : usedResult.rows[0].used;
    const totalDaysPlayed = daysResult.rows.length === 0 ? 0 : daysResult.rows[0].totalDays;

    return NextResponse.json({ used, totalDaysPlayed });
  } catch (err) {
    console.error("Attempts GET error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// POST /api/attempts
export async function POST(request) {
  try {
    const { userId, date } = await request.json();

    if (!userId || !date) {
      return NextResponse.json(
        { error: "userId and date are required." },
        { status: 400 }
      );
    }

    const db = await initDb();

    // Upsert the attempt count
    await db.execute({
      sql: `INSERT INTO attempts (user_id, date, used)
            VALUES (?, ?, 1)
            ON CONFLICT(user_id, date) DO UPDATE SET used = used + 1`,
      args: [userId, date],
    });

    const result = await db.execute({
      sql: "SELECT used FROM attempts WHERE user_id = ? AND date = ?",
      args: [userId, date],
    });

    return NextResponse.json({ used: result.rows[0].used });
  } catch (err) {
    console.error("Attempts POST error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
