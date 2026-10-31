import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/instrument-sans/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/ibm-plex-sans-thai/thai-400.css";
import "@fontsource/ibm-plex-sans-thai/thai-600.css";
import "@fontsource/ibm-plex-sans-thai/thai-700.css";
import "./globals.css";

/** NEXT_PUBLIC_SITE_URL, tolerating a missing "https://" so a typo in the host settings can't break the build. */
function siteUrl() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (!raw) return new URL("http://localhost:3000");
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: "GitHub Wrapped",
  description: "Your year on GitHub as a story: contributions, streaks, languages and your dev personality.",
};

export const viewport: Viewport = { themeColor: "#211c18", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
