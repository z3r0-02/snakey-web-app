import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const db = await initDb();
    const achRes = await db.execute({
      sql: `SELECT achievement_id FROM user_achievements WHERE user_id = ?`,
      args: [userId],
    });

    const unlockedIds = achRes.rows.map((r) => r.achievement_id);
    return NextResponse.json({ unlocked: unlockedIds });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
  }
}
