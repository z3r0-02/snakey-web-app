import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimit";
import { isValidScore } from "@/lib/validation";

const LEADERBOARD_CACHE_HEADER = "public, max-age=0, s-maxage=15, stale-while-revalidate=30";

// Helper to format a Date object for SQLite (YYYY-MM-DD HH:MM:SS)
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

// A user's true best score and rank, independent of the top-10 cap on overall.
async function fetchPersonalStats(db, userId) {
  const bestRes = await db.execute({
    sql: "SELECT MAX(score) as best FROM scores WHERE user_id = ?",
    args: [userId],
  });
  const personalBest = bestRes.rows[0]?.best;

  if (personalBest === null || personalBest === undefined) {
    return { personalBest: 0, personalRank: null };
  }

  const rankRes = await db.execute({
    sql: `
      SELECT COUNT(*) + 1 as rank
      FROM (SELECT user_id, MAX(score) as best FROM scores GROUP BY user_id) ub
      WHERE ub.best > ?
    `,
    args: [personalBest],
  });

  return { personalBest, personalRank: rankRes.rows[0]?.rank ?? null };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const db = await initDb();
    const leaderboards = await fetchLeaderboards(db);

    if (!userId) {
      return NextResponse.json(leaderboards, {
        headers: { "Cache-Control": LEADERBOARD_CACHE_HEADER }, // Cache for 15s, stale-while-revalidate for 30s
      });
    }

    // Personalized response
    const personal = await fetchPersonalStats(db, userId);
    return NextResponse.json({ ...leaderboards, ...personal });
  } catch (err) {
    console.error("Leaderboard GET error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const limited = enforceRateLimit(request, "score", { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const { userId, username, avatar, score } = await request.json();

    if (!userId || !username || score === undefined) {
      return NextResponse.json(
        { error: "userId, username, and score are required." },
        { status: 400 }
      );
    }

    if (!isValidScore(score)) {
      return NextResponse.json({ error: "Invalid score." }, { status: 400 });
    }

    const db = await initDb();

    await db.execute({
      sql: "INSERT INTO scores (user_id, username, avatar, score) VALUES (?, ?, ?, ?)",
      args: [userId, username, avatar || null, score],
    });

    const [leaderboards, personal] = await Promise.all([
      fetchLeaderboards(db),
      fetchPersonalStats(db, userId),
    ]);
    return NextResponse.json({ ...leaderboards, ...personal }, { status: 201 });
  } catch (err) {
    console.error("Leaderboard POST error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

