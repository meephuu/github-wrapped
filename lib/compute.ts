import type { CalendarDay, LangShare, PersonaId, RawWrapped, Stats, Totals } from "./types";

const FALLBACK_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5", Java: "#b07219", "C++": "#f34b7d",
  C: "#555555", "C#": "#178600", Go: "#00ADD8", Rust: "#dea584", Ruby: "#701516", PHP: "#4F5D95",
  Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB", HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051",
  Verilog: "#b2b7f8", SystemVerilog: "#DAE1C2", VHDL: "#adb2cb", "Jupyter Notebook": "#DA5B0B", Vue: "#41b883",
  Svelte: "#ff3e00", Lua: "#000080", Scala: "#c22d40", Haskell: "#5e5086", Elixir: "#6e4a7e", Zig: "#ec915c",
};
export const colorFor = (name: string, given?: string | null) => given || FALLBACK_COLORS[name] || "#8b8b8b";

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Hour (0-23) and weekday (0=Sun) of an ISO timestamp in a given IANA time zone. */
export function localParts(iso: string, timeZone: string) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23", weekday: "short" });
  const parts = f.formatToParts(new Date(iso));
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  return { hour, weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd) };
}

export function longestStreak(days: CalendarDay[]) {
  let best = { days: 0, start: null as string | null, end: null as string | null };
  let runStart: string | null = null;
  let run = 0;
  let prev: number | null = null;
  const sorted = [...days].filter((d) => d.count > 0).sort((a, b) => a.date.localeCompare(b.date));
  for (const d of sorted) {
    const t = Date.parse(d.date + "T00:00:00Z");
    if (prev !== null && t - prev === 864e5) run++;
    else {
      run = 1;
      runStart = d.date;
    }
    if (run > best.days) best = { days: run, start: runStart, end: d.date };
    prev = t;
  }
  return best;
}

/** Builds a calendar from raw activity events when GraphQL data is not available. */
function calendarFromEvents(raw: RawWrapped): CalendarDay[] {
  const counts = new Map<string, number>();
  for (const e of raw.events) {
    const k = e.createdAt.slice(0, 10);
    counts.set(k, (counts.get(k) || 0) + (e.type === "PushEvent" ? e.size : 1));
  }
  const out: CalendarDay[] = [];
  const end = new Date();
  const start = new Date(end.getTime() - 89 * 864e5);
  for (let t = start.getTime(); t <= end.getTime(); t += 864e5) {
    const k = dayKey(new Date(t));
    out.push({ date: k, count: counts.get(k) || 0 });
  }
  return out;
}

function totalsFromEvents(raw: RawWrapped): Totals {
  let commits = 0, prs = 0, issues = 0, reviews = 0;
  for (const e of raw.events) {
    if (e.type === "PushEvent") commits += e.size;
    else if (e.type === "PullRequestEvent") prs++;
    else if (e.type === "IssuesEvent") issues++;
    else if (e.type === "PullRequestReviewEvent") reviews++;
  }
  return { total: commits + prs + issues + reviews, commits, prs, issues, reviews, reposContributed: 0, privateCount: 0 };
}

function languages(raw: RawWrapped): { list: LangShare[]; basis: "bytes" | "repos" } {
  const byBytes = raw.repos.some((r) => r.languages.length > 0);
  const acc = new Map<string, { value: number; color: string | null }>();
  for (const r of raw.repos) {
    if (byBytes) {
      for (const l of r.languages) {
        const cur = acc.get(l.name);
        acc.set(l.name, { value: (cur?.value || 0) + l.size, color: cur?.color || l.color });
      }
    } else if (r.language) {
      const cur = acc.get(r.language);
      acc.set(r.language, { value: (cur?.value || 0) + 1, color: cur?.color || r.languageColor });
    }
  }
  const total = [...acc.values()].reduce((s, v) => s + v.value, 0) || 1;
  const list = [...acc.entries()]
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 6)
    .map(([name, v]) => ({ name, color: colorFor(name, v.color), value: v.value, share: v.value / total }));
  return { list, basis: byBytes ? "bytes" : "repos" };
}

export type ComputeOptions = { timeZone?: string; now?: Date };

export function compute(raw: RawWrapped, opts: ComputeOptions = {}): Stats {
  const timeZone = opts.timeZone || "UTC";
  const now = opts.now || new Date();
  const hasCalendar = !!raw.calendar;
  const heatmap = raw.calendar ?? calendarFromEvents(raw);
  const totals = raw.totals ?? totalsFromEvents(raw);

  const months = Array(12).fill(0);
  const weekdays = Array(7).fill(0);
  let busiestDay: CalendarDay | null = null;
  let activeDays = 0;
  for (const d of heatmap) {
    if (d.count <= 0) continue;
    activeDays++;
    const dt = new Date(d.date + "T00:00:00Z");
    months[dt.getUTCMonth()] += d.count;
    weekdays[dt.getUTCDay()] += d.count;
    if (!busiestDay || d.count > busiestDay.count) busiestDay = d;
  }

  const hours = Array(24).fill(0);
  for (const e of raw.events) {
    const { hour } = localParts(e.createdAt, timeZone);
    hours[hour] += e.type === "PushEvent" ? e.size : 0.5;
  }
  const hourTotal = hours.reduce((a, b) => a + b, 0);
  const weekTotal = weekdays.reduce((a, b) => a + b, 0);
  const argmax = (a: number[], total: number) => (total > 0 ? a.indexOf(Math.max(...a)) : null);

  const lang = languages(raw);
  const streak = longestStreak(heatmap);
  const stars = raw.repos.reduce((s, r) => s + r.stars, 0);
  const joined = new Date(raw.createdAt);

  // Persona: score every archetype 0..1 and keep the strongest.
  const share = (idx: number[]) => (hourTotal ? idx.reduce((s, i) => s + hours[i], 0) / hourTotal : 0);
  const weekendShare = weekTotal ? (weekdays[0] + weekdays[6]) / weekTotal : 0;
  const avgActive = activeDays ? weekTotal / activeDays : 0;
  const scores: Record<PersonaId, number> = {
    "night-owl": clamp((share([22, 23, 0, 1, 2, 3, 4]) - 0.15) / 0.35),
    "early-bird": clamp((share([5, 6, 7, 8, 9]) - 0.1) / 0.3),
    "weekend-warrior": clamp((weekendShare - 0.32) / 0.3),
    "streak-machine": clamp((streak.days - 5) / 25),
    polyglot: clamp((lang.list.length - 3) / 4) * 0.8,
    reviewer: totals.reviews > totals.prs ? clamp((totals.reviews - 10) / 60) : 0,
    "open-sourcer": clamp((stars - 20) / 300),
    sprinter: busiestDay && avgActive ? clamp((busiestDay.count / avgActive - 3) / 8) : 0,
    builder: 0.2,
  };
  const ranked = (Object.entries(scores) as [PersonaId, number][]).sort((a, b) => b[1] - a[1]);

  return {
    login: raw.login,
    name: raw.name || raw.login,
    avatarUrl: raw.avatarUrl,
    year: raw.year,
    source: raw.source,
    viewer: !!raw.viewer,
    includesPrivate: !!raw.includesPrivate,
    privateRepoDetails: !!raw.privateRepoDetails,
    joinedYear: joined.getUTCFullYear(),
    daysOnGitHub: Math.max(0, Math.floor((now.getTime() - joined.getTime()) / 864e5)),
    followers: raw.followers,
    repoCount: raw.repoCount,
    stars,
    totals,
    heatmap,
    hasCalendar,
    activeDays,
    longestStreak: streak,
    busiestDay,
    months,
    busiestMonth: argmax(months, weekTotal),
    weekdays,
    busiestWeekday: argmax(weekdays, weekTotal),
    hours,
    busiestHour: argmax(hours, hourTotal),
    hasHours: hourTotal > 0,
    languages: lang.list,
    languageBasis: lang.basis,
    topRepos: [...raw.repos].sort((a, b) => b.stars - a.stars).slice(0, 3),
    topContribRepos: raw.topContribRepos.slice(0, 5),
    persona: ranked[0][0],
    personaRunnerUp: ranked[1] && ranked[1][1] >= 0.25 ? ranked[1][0] : null,
  };
}
