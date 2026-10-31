import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

/**
 * A tiny encrypted-cookie session. The GitHub token lives only inside an AES-256-GCM encrypted,
 * httpOnly cookie, so JavaScript in the browser can never read it.
 */
export type Session = {
  token: string;
  login: string;
  name: string | null;
  avatarUrl: string | null;
  /** True when the user granted the `repo` scope (private repo names and languages). */
  privateRepos: boolean;
  exp: number;
};

export const SESSION_COOKIE = "gw_session";
export const STATE_COOKIE = "gw_oauth";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("AUTH_SECRET is missing or too short (use at least 32 random characters).");
  return createHash("sha256").update(secret).digest();
}

export function seal(data: unknown): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(JSON.stringify(data), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64url");
}

export function unseal<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    const buf = Buffer.from(value, "base64url");
    const d = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
    d.setAuthTag(buf.subarray(12, 28));
    const out = Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8");
    return JSON.parse(out) as T;
  } catch {
    return null;
  }
}

export function authConfigured() {
  return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.AUTH_SECRET);
}

export async function getSession(): Promise<Session | null> {
  if (!authConfigured()) return null;
  const s = unseal<Session>((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s || s.exp < Date.now()) return null;
  return s;
}

export const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});
