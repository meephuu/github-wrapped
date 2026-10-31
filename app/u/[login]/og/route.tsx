import { ImageResponse } from "next/og";
import { compute } from "@/lib/compute";
import { fetchWrapped } from "@/lib/github";
import { t } from "@/lib/i18n";
import { ALL_TIME, parseYear } from "@/lib/login";

const INK = "#16120f", PAPER = "#fff4e2", SAFFRON = "#ffb21e", PLUM = "#3a1f4d", TOMATO = "#ff5b37";

/** 1200x630 share image used for link previews of /u/:login. */
export async function GET(req: Request, { params }: { params: Promise<{ login: string }> }) {
  const { login } = await params;
  const year = parseYear(new URL(req.url).searchParams.get("year") ?? undefined);
  const d = t("en");
  try {
    const s = compute(await fetchWrapped(login, year));
    const days = s.heatmap.slice(-364);
    const max = Math.max(1, ...days.map((x) => x.count));
    const weeks: { count: number }[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    const stat = (k: string, v: string) => (
      <div style={{ display: "flex", flexDirection: "column", background: "rgba(255,244,226,0.1)", borderRadius: 18, padding: "18px 22px", flex: 1 }}>
        <span style={{ fontSize: 18, letterSpacing: 2, textTransform: "uppercase", opacity: 0.75 }}>{k}</span>
        <span style={{ fontSize: 44, fontWeight: 800, marginTop: 6 }}>{v}</span>
      </div>
    );
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: PLUM, color: PAPER, padding: 56, gap: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {s.avatarUrl && <img src={s.avatarUrl} width={84} height={84} style={{ borderRadius: 42 }} alt="" />}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: -2 }}>@{s.login}</span>
              <span style={{ fontSize: 24, color: SAFFRON, letterSpacing: 3, textTransform: "uppercase" }}>GitHub Wrapped {year === ALL_TIME ? "All Time" : year}</span>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", background: SAFFRON, color: INK, borderRadius: 999, padding: "14px 26px", fontSize: 30, fontWeight: 800 }}>
              {d.persona(s.persona)[0]}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {weeks.map((w, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {w.map((x, j) => (
                  <div key={j} style={{ width: 16, height: 16, borderRadius: 3, background: x.count ? SAFFRON : "rgba(255,244,226,0.12)", opacity: x.count ? 0.35 + 0.65 * (x.count / max) : 1 }} />
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            {stat("Contributions", s.totals.total.toLocaleString("en-US"))}
            {stat("Best streak", `${s.longestStreak.days} days`)}
            {stat("Top language", s.languages[0]?.name ?? "—")}
            {stat("Stars", s.stars.toLocaleString("en-US"))}
          </div>
        </div>
      ),
      { width: 1200, height: 630, headers: { "Cache-Control": "public, s-maxage=3600" } },
    );
  } catch {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: PLUM, color: PAPER, fontSize: 96, fontWeight: 800 }}>
          GitHub <span style={{ color: TOMATO, marginLeft: 24 }}>Wrapped</span>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }
}
