export const dynamic = "force-dynamic";

export function GET() {
  const dateStr = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify({ dateStr }), {
    headers: { "Content-Type": "application/json" },
  });
}
