import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

// Cache the GET response for 15s at Vercel's edge — the leaderboard is
// identical for every visitor, so repeat requests in that window are
// served instantly instead of round-tripping to Turso. `export const
// revalidate` alone doesn't reliably produce this for a DB-backed route
// handler (verified: it left Cache-Control as "max-age=0, must-revalidate"
// in production), so the header is set explicitly on the response instead.
// max-age=0 keeps each browser tab always revalidating on navigation;
// s-maxage=15 is what the shared/CDN cache actually honors.
const LEADERBOARD_CACHE_HEADER = "public, max-age=0, s-maxage=15, stale-while-revalidate=30";

// scores.created_at is stored via SQLite's own datetime('now'), which comes
// out as "YYYY-MM-DD HH:MM:SS" in UTC — not ISO 8601. Comparing that against
// a toISOString() string ("...THH:MM:SS.sssZ") breaks: SQLite compares
// TEXT columns lexicographically, and the space in the stored format sorts
// before "T", so any same-day timestamp reads as "less than" today's start
// and gets excluded. Format boundaries to match the stored format exactly,
// using UTC throughout so this doesn't depend on the server's local zone.
function formatForSqlite(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} 00:00:00`;
}

function getTimeBoundaries() {
  const now = new Date();

  // Start of today (UTC midnight)
  const todayStart = formatForSqlite(now);

  // Start of this week (Monday UTC midnight) -> resets after Sunday midnight
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

