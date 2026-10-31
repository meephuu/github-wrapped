import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Story from "@/components/Story";
import { fetchWrapped, WrappedError } from "@/lib/github";
import { parseYear } from "@/lib/login";
import { getSession } from "@/lib/session";
import type { RawWrapped } from "@/lib/types";

export const metadata: Metadata = { title: "My GitHub Wrapped", robots: { index: false } };

export default async function MePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const year = parseYear((await searchParams).year);
  const session = await getSession();
  if (!session) redirect(`/auth/login?year=${year}`);
  let raw: RawWrapped;
  try {
    raw = await fetchWrapped(session.login, year, { mode: "self", token: session.token, privateRepos: session.privateRepos });
  } catch (e) {
    const err = e instanceof WrappedError ? e : new WrappedError("network", String(e));
    // A revoked token: send them back through sign-in.
    if (err.code === "auth") redirect(`/auth/login?year=${year}${session.privateRepos ? "&private=1" : ""}`);
    redirect(`/?error=${err.code}${process.env.NODE_ENV !== "production" ? `&detail=${encodeURIComponent(err.detail)}` : ""}`);
  }
  return <Story raw={raw} />;
}
