import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Story from "@/components/Story";
import { fetchWrapped, WrappedError } from "@/lib/github";
import { parseYear } from "@/lib/login";
import type { RawWrapped } from "@/lib/types";

type Props = { params: Promise<{ login: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { login } = await params;
  const year = parseYear((await searchParams).year);
  const title = `@${login}'s GitHub Wrapped ${year}`;
  return {
    title,
    description: `Contributions, streaks, languages and dev personality for @${login} in ${year}.`,
    openGraph: { title, images: [`/u/${login}/og?year=${year}`] },
    twitter: { card: "summary_large_image", title, images: [`/u/${login}/og?year=${year}`] },
  };
}

export default async function UserPage({ params, searchParams }: Props) {
  const { login } = await params;
  const year = parseYear((await searchParams).year);
  let raw: RawWrapped;
  try {
    raw = await fetchWrapped(login, year);
  } catch (e) {
    const err = e instanceof WrappedError ? e : new WrappedError("network", String(e));
    const detail = process.env.NODE_ENV !== "production" && err.detail ? `&detail=${encodeURIComponent(err.detail.slice(0, 300))}` : "";
    redirect(`/?error=${err.code}&u=${encodeURIComponent(login)}${detail}`);
  }
  return <Story raw={raw} />;
}
