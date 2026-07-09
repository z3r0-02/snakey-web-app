import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const dateStr = new Date().toISOString().slice(0, 10);
  return NextResponse.json({ dateStr });
}
