import { NextResponse } from "next/server";
import { compute } from "@/lib/compute";
import { fetchWrapped, WrappedError } from "@/lib/github";
import { parseYear } from "@/lib/login";

/** JSON API: GET /api/wrapped/:login?year=2026&tz=Asia/Bangkok */
export async function GET(req: Request, { params }: { params: Promise<{ login: string }> }) {
  const { login } = await params;
  const url = new URL(req.url);
  const year = parseYear(url.searchParams.get("year") ?? undefined);
  const timeZone = url.searchParams.get("tz") || "UTC";
  try {
    const raw = await fetchWrapped(login, year);
    const stats = compute(raw, { timeZone });
    return NextResponse.json(stats, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (e) {
    const code = e instanceof WrappedError ? e.code : "network";
    const status = code === "notfound" ? 404 : code === "invalid" ? 400 : code === "rate" ? 429 : 502;
    return NextResponse.json({ error: code }, { status });
  } 
}
