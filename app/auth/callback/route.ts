import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchViewer } from "@/lib/github";
import { cookieOpts, seal, SESSION_COOKIE, SESSION_MAX_AGE, STATE_COOKIE, unseal, type Session } from "@/lib/session";

/** GitHub sends the user back here with ?code=…&state=… */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const fail = (why: string) => {
    console.error(`[github-wrapped] sign-in failed: ${why}`);
    const res = NextResponse.redirect(new URL("/?error=signin", url));
    res.cookies.delete(STATE_COOKIE);
    return res;
  };

  const saved = unseal<{ state: string; wantsPrivate: boolean; year: string }>((await cookies()).get(STATE_COOKIE)?.value);
  const code = url.searchParams.get("code");
  if (url.searchParams.get("error")) return fail(`GitHub said ${url.searchParams.get("error")}`);
  if (!saved || !code || saved.state !== url.searchParams.get("state")) return fail("state mismatch (cookie expired or link reused)");

  let token: string;
  try {
    const r = await fetch(`${process.env.GITHUB_URL || "https://github.com"}/login/oauth/access_token`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: new URL("/auth/callback", url).toString(),
      }),
      cache: "no-store",
    });
    const body = (await r.json()) as { access_token?: string; error?: string; error_description?: string };
    if (!body.access_token) return fail(body.error_description || body.error || `HTTP ${r.status}`);
    token = body.access_token;
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }

  let viewer;
  try {
    viewer = await fetchViewer(token);
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }

  const session: Session = {
    token,
    login: viewer.login,
    name: viewer.name,
    avatarUrl: viewer.avatarUrl,
    privateRepos: viewer.scopes.split(/,\s*/).includes("repo"),
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const res = NextResponse.redirect(new URL(`/me${saved.year ? `?year=${encodeURIComponent(saved.year)}` : ""}`, url));
  res.cookies.set(SESSION_COOKIE, seal(session), cookieOpts(SESSION_MAX_AGE));
  res.cookies.delete(STATE_COOKIE);
  return res;
}
