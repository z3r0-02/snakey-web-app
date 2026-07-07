import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

const LEADERBOARD_CACHE_HEADER = "public, max-age=0, s-maxage=15, stale-while-revalidate=30";

function formatForSqlite(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} 00:00:00`;
}

function getTimeBoundaries() {
  const now = new Date();

  // Start of today (UTC midnight)
  const todayStart = formatForSqlite(now);

  // Start of this week (Monday UTC midnight)
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
  const weekStart = formatForSqlite(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff)));

  return { todayStart, weekStart };
}

// Helper to fetch all three leaderboards
async function fetchLeaderboards(db) {
  const { todayStart, weekStart } = getTimeBoundaries();

    const queryTemplate = `
      SELECT s.user_id, s.username, s.avatar, MAX(s.score) as score, s.created_at, u.active_title 
      FROM scores s
      JOIN users u ON s.user_id = u.id
      {WHERE_CLAUSE}
      GROUP BY s.user_id 
      ORDER BY score DESC LIMIT {LIMIT_CLAUSE}
    `;

  const [dailyRes, weeklyRes, overallRes] = await Promise.all([
    db.execute({
      sql: queryTemplate
             .replace("{WHERE_CLAUSE}", "WHERE s.created_at >= ?")
             .replace("{LIMIT_CLAUSE}", "3"),
      args: [todayStart],
    }),
    db.execute({
      sql: queryTemplate
             .replace("{WHERE_CLAUSE}", "WHERE s.created_at >= ?")
             .replace("{LIMIT_CLAUSE}", "3"),
      args: [weekStart],
    }),
    db.execute(
      queryTemplate
        .replace("{WHERE_CLAUSE}", "")
        .replace("{LIMIT_CLAUSE}", "10")
    ),
  ]);

  const mapRows = (rows) =>
    rows.map((r) => ({
      id: r.user_id,
      name: r.username,
      avatar: r.avatar,
      score: r.score,
      date: r.created_at,
      title: r.active_title,
    }));

  return {
    daily: mapRows(dailyRes.rows),
    weekly: mapRows(weeklyRes.rows),
    overall: mapRows(overallRes.rows),
  };
}

export async function GET() {
  try {
    const db = await initDb();
    const leaderboards = await fetchLeaderboards(db);
    return NextResponse.json(leaderboards, {
      headers: { "Cache-Control": LEADERBOARD_CACHE_HEADER },
    });
  } catch (err) {
    console.error("Leaderboard GET error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId, username, avatar, score } = await request.json();

    if (!userId || !username || score === undefined) {
      return NextResponse.json(
        { error: "userId, username, and score are required." },
        { status: 400 }
      );
    }

    const db = await initDb();

    await db.execute({
      sql: "INSERT INTO scores (user_id, username, avatar, score) VALUES (?, ?, ?, ?)",
      args: [userId, username, avatar || null, score],
    });

    const leaderboards = await fetchLeaderboards(db);
    return NextResponse.json(leaderboards, { status: 201 });
  } catch (err) {
    console.error("Leaderboard POST error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

