import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { authConfigured, cookieOpts, seal, STATE_COOKIE } from "@/lib/session";

/** GET /auth/login?private=1 → redirects to GitHub's consent screen. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!authConfigured()) return NextResponse.redirect(new URL("/?error=authsetup", url));
  const wantsPrivate = url.searchParams.get("private") === "1";
  const year = url.searchParams.get("year") ?? "";
  const state = randomBytes(16).toString("hex");
  const gh = new URL(`${process.env.GITHUB_URL || "https://github.com"}/login/oauth/authorize`);
  gh.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
  gh.searchParams.set("redirect_uri", new URL("/auth/callback", url).toString());
  // read:user is enough for private contribution counts. repo adds private repo names and languages.
  gh.searchParams.set("scope", wantsPrivate ? "read:user repo" : "read:user");
  gh.searchParams.set("state", state);
  gh.searchParams.set("allow_signup", "false");
  const res = NextResponse.redirect(gh);
  res.cookies.set(STATE_COOKIE, seal({ state, wantsPrivate, year }), cookieOpts(600));
  return res;
}
