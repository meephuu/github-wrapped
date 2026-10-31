"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { compute } from "@/lib/compute";
import { t, type Dict } from "@/lib/i18n";
import type { RawWrapped, Stats } from "@/lib/types";
import { Heatmap, HeatLegend } from "./Heatmap";
import { LangToggle, useLang } from "./useLang";

type Palette = "cobalt" | "tomato" | "saffron" | "teal" | "pink" | "plum" | "moss" | "ink";
const COLORS: Record<Palette, [string, string]> = {
  cobalt: ["var(--cobalt)", "var(--paper)"],
  tomato: ["var(--tomato)", "var(--ink)"],
  saffron: ["var(--saffron)", "var(--ink)"],
  teal: ["var(--teal)", "var(--paper)"],
  pink: ["var(--pink)", "var(--ink)"],
  plum: ["var(--plum)", "var(--paper)"],
  moss: ["var(--moss)", "var(--paper)"],
  ink: ["var(--ink)", "var(--paper)"],
};
type Slide = { id: string; palette: Palette; node: ReactNode; last?: boolean };

function useReducedMotion() {
  const [rm, setRm] = useState(false);
  useEffect(() => setRm(matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  return rm;
}

function CountUp({ value, fmt }: { value: number; fmt: (n: number) => string }) {
  const [v, setV] = useState(value);
  const rm = useReducedMotion();
  useEffect(() => {
    if (rm) return setV(value);
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 900);
      setV(Math.round(value * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, rm]);
  return <>{fmt(v)}</>;
}

function Avatar({ s, className = "avatar" }: { s: Stats; className?: string }) {
  const [broken, setBroken] = useState(false);
  const initials = s.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  if (s.avatarUrl && !broken)
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={className} src={s.avatarUrl} alt="" crossOrigin="anonymous" onError={() => setBroken(true)} />;
  return (
    <span className={className}>
      <b>{initials}</b>
    </span>
  );
}

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

function fmtDate(iso: string, lang: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function monthAxis(s: Stats, d: Dict) {
  if (!s.hasCalendar) {
    const a = new Date(s.heatmap[0].date).getUTCMonth();
    const b = new Date(s.heatmap.at(-1)!.date).getUTCMonth();
    return [d.months[a].slice(0, 3), d.months[b].slice(0, 3)];
  }
  return [0, 3, 6, 9].map((m) => d.months[m].slice(0, 3)).concat(d.months[11].slice(0, 3));
}

function SummaryCard({ s, d, cardRef }: { s: Stats; d: Dict; cardRef: React.RefObject<HTMLDivElement | null> }) {
  const [title] = d.persona(s.persona);
  return (
    <div className="card" ref={cardRef}>
      <div className="card-head">
        <Avatar s={s} />
        <div>
          <b>@{s.login}</b>
          <span>
            {d.wrapped} {s.hasCalendar ? s.year : "· 90d"}
          </span>
        </div>
      </div>
      <Heatmap days={s.heatmap} />
      <div className="grid">
        <div className="cell">
          <div className="k">{d.totalLabel}</div>
          <div className="v">{d.n(s.totals.total)}</div>
        </div>
        <div className="cell">
          <div className="k">{d.bestStreak}</div>
          <div className="v">{s.longestStreak.days}d</div>
        </div>
        <div className="cell">
          <div className="k">{d.topLanguage}</div>
          <div className="v">{s.languages[0]?.name ?? "—"}</div>
        </div>
        <div className="cell">
          <div className="k">{d.busiestHour}</div>
          <div className="v">{s.busiestHour == null ? "—" : hh(s.busiestHour)}</div>
        </div>
      </div>
      <div className="cell" style={{ background: "var(--saffron)", color: "var(--ink)" }}>
        <div className="k">{d.personality}</div>
        <div className="v">{title}</div>
      </div>
      <div className="card-foot">
        <span>github wrapped</span>
        <span>{s.source === "sample" ? d.sampleTag : `${d.n(s.stars)} ★`}</span>
      </div>
    </div>
  );
}

function buildSlides(s: Stats, d: Dict, actions: ReactNode, cardRef: React.RefObject<HTMLDivElement | null>): Slide[] {
  const out: Slide[] = [];
  const sample = s.source === "sample" ? <span className="tag">{d.sampleTag}</span> : null;
  const quiet = s.totals.total === 0 && s.activeDays === 0;

  out.push({
    id: "intro",
    palette: "cobalt",
    node: (
      <>
        <span className="eyebrow">{sample ?? (s.includesPrivate ? <span className="tag">{d.withPrivate}</span> : `GitHub Wrapped · ${s.year}`)}</span>
        <h2 className="mid">{d.hey(s.name)}</h2>
        <p className="lead">{d.introLead(s.year, s.joinedYear)}</p>
        <div className="spacer" />
        <div>
          <div className="big">
            <CountUp value={s.daysOnGitHub} fmt={d.n} />
          </div>
          <p className="small">{d.daysSince}</p>
        </div>
        <p className="small" style={{ opacity: 0.65 }}>{d.tapHint}</p>
      </>
    ),
  });

  if (quiet) {
    out.push({
      id: "quiet",
      palette: "tomato",
      node: (
        <>
          <span className="eyebrow">{d.contributions}</span>
          <h2 className="mid">{d.quiet}</h2>
          <p className="lead">{d.quietLead}</p>
        </>
      ),
    });
  } else {
    out.push({
      id: "total",
      palette: "tomato",
      node: (
        <>
          <span className="eyebrow">{d.contributions}</span>
          <div className="big">
            <CountUp value={s.totals.total} fmt={d.n} />
          </div>
          <p className="lead">{d.contribLead(s.year, !s.hasCalendar)}</p>
          <div className="spacer" />
          <div className="grid">
            {(
              [
                [d.commits, s.totals.commits],
                [d.prs, s.totals.prs],
                [d.reviews, s.totals.reviews],
                [d.issues, s.totals.issues],
              ] as const
            ).map(([k, v]) => (
              <div className="cell" key={k}>
                <div className="k">{k}</div>
                <div className="v">{d.n(v)}</div>
              </div>
            ))}
          </div>
          {s.totals.privateCount > 0 && <p className="small">{d.privateNote(s.totals.privateCount)}</p>}
          {!s.hasCalendar && s.source === "rest" && <p className="small">{d.partialNote}</p>}
        </>
      ),
    });

    out.push({
      id: "heatmap",
      palette: "teal",
      node: (
        <>
          <span className="eyebrow">{d.yourYear}</span>
          <h2 className="mid">{d.activeDaysLine(s.activeDays, s.heatmap.length)}</h2>
          <div className="spacer" />
          {s.hasCalendar && s.heatmap.length > 190 ? (
            <>
              <Heatmap minWeeks={27} days={s.heatmap.filter((x) => x.date.slice(5, 7) <= "06")} monthLabels={d.months.slice(0, 6).map((m) => m.slice(0, 3))} />
              <Heatmap minWeeks={27} days={s.heatmap.filter((x) => x.date.slice(5, 7) > "06")} monthLabels={d.months.slice(6).map((m) => m.slice(0, 3))} />
            </>
          ) : (
            <Heatmap days={s.heatmap} monthLabels={monthAxis(s, d)} />
          )}
          <HeatLegend less={d.less} more={d.more} />
        </>
      ),
    });

    out.push({
      id: "streak",
      palette: "saffron",
      node: (
        <>
          <span className="eyebrow">{d.streakEyebrow}</span>
          <div className="big" style={{ fontSize: "clamp(90px, 34vw, 170px)" }}>
            <CountUp value={s.longestStreak.days} fmt={d.n} />
          </div>
          <p className="lead">{d.streakDays(s.longestStreak.days)}</p>
          <div className="spacer" />
          <p className="lead">
            {s.longestStreak.start && s.longestStreak.end && s.longestStreak.days > 1
              ? d.streakRange(fmtDate(s.longestStreak.start, d.lang), fmtDate(s.longestStreak.end, d.lang))
              : d.streakNone}
          </p>
        </>
      ),
    });

    if (s.busiestMonth != null) {
      const mx = Math.max(...s.months) || 1;
      out.push({
        id: "peak",
        palette: "pink",
        node: (
          <>
            <span className="eyebrow">{d.peakEyebrow}</span>
            <h2 className="mid">{d.peakMonth(d.months[s.busiestMonth])}</h2>
            {s.busiestDay && <p className="lead">{d.peakDay(fmtDate(s.busiestDay.date, d.lang), s.busiestDay.count)}</p>}
            <div className="spacer" />
            <div>
              <div className="cols">
                {s.months.map((v, i) => (
                  <div key={i} className={`c${i === s.busiestMonth ? " peak" : ""}`}>
                    <i style={{ height: `${(v / mx) * 100}%`, animationDelay: `${i * 0.04}s` }} />
                  </div>
                ))}
              </div>
              <div className="axis">
                {d.months.map((m, i) => (
                  <span key={i}>{m.slice(0, 1)}</span>
                ))}
              </div>
            </div>
          </>
        ),
      });
    }

    if (s.hasHours || s.busiestWeekday != null) {
      const hm = Math.max(...s.hours) || 1;
      const wm = Math.max(...s.weekdays) || 1;
      out.push({
        id: "rhythm",
        palette: "cobalt",
        node: (
          <>
            <span className="eyebrow">{d.rhythmEyebrow}</span>
            {s.hasHours && s.busiestHour != null ? (
              <>
                <div className="big">{hh(s.busiestHour)}</div>
                <p className="lead">{d.hourVibe(s.busiestHour)}</p>
              </>
            ) : (
              <h2 className="mid">{s.busiestWeekday != null ? d.days[s.busiestWeekday] : ""}</h2>
            )}
            <div className="spacer" />
            {s.hasHours && (
              <div>
                <div className="cols" style={{ height: 90 }}>
                  {s.hours.map((v, i) => (
                    <div key={i} className={`c${i === s.busiestHour ? " peak" : ""}`}>
                      <i style={{ height: `${(v / hm) * 100}%`, animationDelay: `${i * 0.02}s` }} />
                    </div>
                  ))}
                </div>
                <div className="axis">
                  <span>00</span>
                  <span>06</span>
                  <span>12</span>
                  <span>18</span>
                  <span>23</span>
                </div>
              </div>
            )}
            {s.busiestWeekday != null && (
              <>
                <span className="eyebrow">
                  {d.favDay}: {d.days[s.busiestWeekday]}
                </span>
                <div className="weekrow">
                  {s.weekdays.map((v, i) => (
                    <div key={i} className={`d${i === s.busiestWeekday ? " peak" : ""}`}>
                      <i style={{ height: `${Math.max((v / wm) * 100, 3)}%`, animationDelay: `${i * 0.05}s` }} />
                      {d.daysShort[i]}
                    </div>
                  ))}
                </div>
              </>
            )}
            {s.hasHours && <p className="small">{d.hoursNote}</p>}
          </>
        ),
      });
    }
  }

  if (s.languages.length) {
    const top = s.languages[0];
    const max = top.share;
    out.push({
      id: "languages",
      palette: "moss",
      node: (
        <>
          <span className="eyebrow">{d.langEyebrow}</span>
          <div className="big" style={{ fontSize: "clamp(44px, 14vw, 84px)" }}>
            {top.name}
          </div>
          <p className="lead">{d.langLead(Math.round(top.share * 100), s.languageBasis)}</p>
          <div className="spacer" />
          <div className="stripe" aria-hidden>
            {s.languages.map((l) => (
              <i key={l.name} style={{ width: `${l.share * 100}%`, background: l.color }} />
            ))}
          </div>
          <div className="langs">
            {s.languages.slice(0, 5).map((l, i) => (
              <div className="lang" key={l.name}>
                <span>
                  <i className="dot" style={{ background: l.color }} />
                  {l.name}
                </span>
                <div className="track">
                  <i style={{ width: `${(l.share / max) * 100}%`, animationDelay: `${0.15 + i * 0.08}s` }} />
                </div>
                <span>{Math.round(l.share * 100)}%</span>
              </div>
            ))}
          </div>
          <p className="small">{d.langBasis(s.languageBasis)}</p>
        </>
      ),
    });
  }

  const fav = s.topRepos[0];
  out.push({
    id: "repos",
    palette: "teal",
    node: (
      <>
        <span className="eyebrow">{d.reposEyebrow}</span>
        <div className="big">
          <CountUp value={s.repoCount} fmt={d.n} />
        </div>
        <p className="lead">{d.reposLead(s.stars, s.privateRepoDetails)}</p>
        <div className="spacer" />
        {fav && (
          <>
            <span className="eyebrow">{d.fanFav}</span>
            <a className="repo" href={fav.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              <b>
                {fav.name}
                {fav.private && <span className="lock">{d.privateRepo}</span>}
              </b>
              {fav.description && <span className="small">{fav.description}</span>}
              <span className="meta">
                <span>★ {d.n(fav.stars)}</span>
                <span>⑂ {d.n(fav.forks)}</span>
                {fav.language && <span>{fav.language}</span>}
              </span>
            </a>
          </>
        )}
        {s.topContribRepos.length > 0 && (
          <>
            <span className="eyebrow">{d.whereYouCommitted}</span>
            <div className="rlist">
              {s.topContribRepos.slice(0, 4).map((r) => (
                <div className="rrow" key={r.name}>
                  <span>
                    {r.name.split("/").pop()}
                    {r.private && <span className="lock">{d.privateRepo}</span>}
                  </span>
                  <span>{d.commitsN(r.commits)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    ),
  });

  const [pTitle, pDesc] = d.persona(s.persona);
  out.push({
    id: "persona",
    palette: "saffron",
    node: (
      <>
        <span className="eyebrow">{d.personaEyebrow}</span>
        <h2 className="mid" style={{ fontSize: "clamp(44px, 14vw, 72px)" }}>
          {pTitle}
        </h2>
        <p className="lead">{pDesc}</p>
        <div className="spacer" />
        {s.personaRunnerUp && <p className="lead">{d.runnerUp(d.persona(s.personaRunnerUp)[0])}</p>}
      </>
    ),
  });

  out.push({
    id: "summary",
    palette: "plum",
    last: true,
    node: (
      <>
        <SummaryCard s={s} d={d} cardRef={cardRef} />
        <div className="spacer" />
        {actions}
      </>
    ),
  });
  return out;
}

export default function Story({ raw }: { raw: RawWrapped }) {
  const router = useRouter();
  const [lang, setLang] = useLang();
  const d = useMemo(() => t(lang), [lang]);
  const [tz, setTz] = useState("UTC");
  useEffect(() => setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"), []);
  const stats = useMemo(() => compute(raw, { timeZone: tz }), [raw, tz]);

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);

  const savePng = useCallback(async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const opts = { pixelRatio: 3, backgroundColor: "#16120f" };
      let url: string;
      try {
        url = await toPng(cardRef.current, opts);
      } catch {
        url = await toPng(cardRef.current, { ...opts, filter: (n) => (n as HTMLElement).tagName !== "IMG" });
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = `github-wrapped-${stats.login}-${stats.year}.png`;
      a.click();
    } catch {
      setNote("Couldn't create the image in this browser.");
    } finally {
      setSaving(false);
    }
  }, [stats.login, stats.year]);

  // A signed-in user's /me page is private to them, so always share the public version.
  const shareUrl = useCallback(
    () => (stats.viewer ? `${location.origin}/u/${stats.login}?year=${stats.year}` : location.href),
    [stats.viewer, stats.login, stats.year],
  );

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setNote(stats.viewer ? `${d.copied} ${d.publicLinkNote}` : d.copied);
    } catch {
      setNote(shareUrl());
    }
  }, [d, shareUrl, stats.viewer]);

  const actions = (
    <>
      <div className="actions">
        <button className="btn accent" type="button" onClick={savePng} disabled={saving}>
          {saving ? d.saving : d.savePng}
        </button>
        <button className="btn ghost" type="button" onClick={copyLink}>
          {d.copyLink}
        </button>
        <button className="btn ghost" type="button" onClick={() => setIdx(0)}>
          {d.replay}
        </button>
        <button className="btn ghost" type="button" onClick={() => router.push("/")}>
          {d.another}
        </button>
      </div>
      <p className="small" aria-live="polite" style={{ userSelect: "text", overflowWrap: "anywhere" }}>
        {note}
      </p>
    </>
  );

  const slides = buildSlides(stats, d, actions, cardRef);
  const cur = slides[Math.min(idx, slides.length - 1)];
  const [bg, fg] = COLORS[cur.palette];

  const go = useCallback((n: number) => setIdx((i) => Math.max(0, Math.min(slides.length - 1, i + n))), [slides.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input,select,textarea")) return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.key === "Escape") router.push("/");
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [go, router]);

  const interactive = (el: EventTarget) => !!(el as HTMLElement).closest("button,a,input,select,.card");

  return (
    <div
      className={`stage${paused ? " paused" : ""}`}
      style={{ background: bg, color: fg, ["--bgc" as string]: bg }}
      onPointerDown={(e) => {
        if (interactive(e.target)) return;
        held.current = false;
        holdTimer.current = setTimeout(() => {
          held.current = true;
          setPaused(true);
        }, 260);
      }}
      onPointerUp={() => {
        if (holdTimer.current) clearTimeout(holdTimer.current);
        if (held.current) setPaused(false);
      }}
      onClick={(e) => {
        if (held.current || interactive(e.target)) return;
        const r = e.currentTarget.getBoundingClientRect();
        go(e.clientX - r.left < r.width / 3 ? -1 : 1);
      }}
    >
      <div className="bars" aria-hidden>
        {slides.map((s, i) => (
          <div key={s.id} className={`bar ${i < idx || (i === idx && cur.last) ? "done" : i === idx ? "on" : ""}`}>
            {i === idx && !cur.last ? <i key={`${s.id}-${idx}`} onAnimationEnd={() => go(1)} /> : <i />}
          </div>
        ))}
      </div>
      <div className="who">
        <Avatar s={stats} />
        <span className="handle">@{stats.login}</span>
        <span className="ctl">
          <LangToggle lang={lang} onChange={setLang} />
          <button className="iconbtn" type="button" aria-label={paused ? d.play : d.pause} onClick={() => setPaused((p) => !p)}>
            {paused ? "▶" : "❚❚"}
          </button>
          <button className="iconbtn" type="button" aria-label={d.close} onClick={() => router.push("/")}>
            ✕
          </button>
        </span>
      </div>
      <section key={`${cur.id}-${lang}`} className="slide rise" aria-live="polite">
        {cur.node}
      </section>
    </div>
  );
}
