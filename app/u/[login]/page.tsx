import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Story from "@/components/Story";
import { fetchWrapped, WrappedError } from "@/lib/github";
import { ALL_TIME, parseYear, yearParam } from "@/lib/login";
import type { RawWrapped } from "@/lib/types";

type Props = { params: Promise<{ login: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { login } = await params;
  const year = parseYear((await searchParams).year);
  const title = `@${login}'s GitHub Wrapped ${year === ALL_TIME ? "All Time" : year}`;
  const image = `/u/${login}/og?year=${yearParam(year)}`;
  return {
    title,
    description: `Contributions, streaks, languages and dev personality for @${login} ${year === ALL_TIME ? "of all time" : `in ${year}`}.`,
    openGraph: { title, images: [image] },
    twitter: { card: "summary_large_image", title, images: [image] },
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
