import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/** POST only, so a link on another site can't sign you out. */
export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
