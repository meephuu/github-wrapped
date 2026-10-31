import type { Metadata } from "next";
import Story from "@/components/Story";
import { parseYear } from "@/lib/login";
import { sampleRaw } from "@/lib/sample";

export const metadata: Metadata = { title: "Sample story · GitHub Wrapped" };

export default async function Sample({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return <Story raw={sampleRaw(parseYear(sp.year))} />;
}
