import type { ActivityEvent, CalendarDay, RawWrapped, Repo } from "./types";

/** Deterministic made-up data so the app can be demoed without hitting GitHub. */
export function sampleRaw(year = new Date().getFullYear(), now = new Date()): RawWrapped {
  let seed = 20261031;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const repoDefs: [string, string, number, [string, number][]][] = [
    ["togethr-api", "Group planning API for friends", 58, [["TypeScript", 182000], ["CSS", 12000]]],
    ["tiny-db", "A B+tree key-value store, built to learn database internals", 41, [["Rust", 96000]]],
    ["campus-timetable", "Course clash checker", 23, [["TypeScript", 64000], ["HTML", 6000]]],
    ["cpu-sim", "RV32I simulator with a step debugger", 17, [["C++", 88000], ["Python", 9000]]],
    ["ml-homework", null as unknown as string, 4, [["Jupyter Notebook", 140000], ["Python", 30000]]],
    ["dashboard", "Personal dashboard", 6, [["TypeScript", 51000], ["CSS", 8000]]],
    ["go-kv", "Raft-replicated KV store", 9, [["Go", 47000]]],
    ["verilog-alu", "ALU + testbench", 2, [["Verilog", 21000]]],
    ["dotfiles", null as unknown as string, 1, [["Shell", 4000]]],
  ];
  const colors: Record<string, string> = {
    TypeScript: "#3178c6", CSS: "#563d7c", Rust: "#dea584", HTML: "#e34c26", "C++": "#f34b7d", Python: "#3572A5",
    "Jupyter Notebook": "#DA5B0B", Go: "#00ADD8", Verilog: "#b2b7f8", Shell: "#89e051",
  };
  const repos: Repo[] = repoDefs.map(([name, description, stars, langs]) => ({
    name,
    description: description || null,
    url: `https://github.com/sample-dev/${name}`,
    stars,
    forks: Math.floor(stars / 6),
    language: langs[0][0],
    languageColor: colors[langs[0][0]],
    languages: langs.map(([n, size]) => ({ name: n, size, color: colors[n] })),
  }));

  const calendar: CalendarDay[] = [];
  const start = Date.UTC(year, 0, 1);
  const end = Math.min(Date.UTC(year, 11, 31), now.getTime());
  for (let t = start; t <= end; t += 864e5) {
    const d = new Date(t);
    const m = d.getUTCMonth();
    const wd = d.getUTCDay();
    // Busier around exams and a mid-year side-project burst.
    const season = m === 5 || m === 6 ? 0.85 : m === 2 || m === 9 ? 0.75 : 0.55;
    const weekend = wd === 0 || wd === 6 ? 0.9 : 1;
    const active = rnd() < season * weekend;
    const burst = rnd() < 0.03 ? 18 : 0;
    calendar.push({ date: d.toISOString().slice(0, 10), count: active ? 1 + Math.floor(rnd() * 7) + burst : 0 });
  }
  // A guaranteed streak in July.
  for (const c of calendar) if (c.date >= `${year}-07-02` && c.date <= `${year}-07-24` && c.count === 0) c.count = 2;

  const events: ActivityEvent[] = [];
  for (let d = 0; d < 90; d++) {
    if (rnd() < 0.3) continue;
    const n = 1 + Math.floor(rnd() * 4);
    for (let k = 0; k < n; k++) {
      const night = rnd() < 0.62;
      const hourBkk = night ? (21 + Math.floor(rnd() * 6)) % 24 : 9 + Math.floor(rnd() * 11);
      const t = new Date(now.getTime() - d * 864e5);
      t.setUTCHours((hourBkk - 7 + 24) % 24, Math.floor(rnd() * 60));
      events.push({ type: rnd() < 0.85 ? "PushEvent" : "PullRequestEvent", createdAt: t.toISOString(), size: 1 + Math.floor(rnd() * 5) });
    }
  }

  const total = calendar.reduce((s, c) => s + c.count, 0);
  const prs = Math.round(total * 0.06);
  const reviews = Math.round(total * 0.04);
  const issues = Math.round(total * 0.03);
  return {
    login: "sample-dev",
    name: "Sample Developer",
    avatarUrl: null,
    createdAt: "2023-08-14T09:00:00Z",
    followers: 31,
    repoCount: 24,
    year,
    repos,
    calendar,
    totals: { total, commits: total - prs - reviews - issues, prs, issues, reviews, reposContributed: 11, privateCount: 0 },
    topContribRepos: [
      { name: "sample-dev/togethr-api", url: repos[0].url, language: "TypeScript", color: colors.TypeScript, commits: 214 },
      { name: "sample-dev/tiny-db", url: repos[1].url, language: "Rust", color: colors.Rust, commits: 167 },
      { name: "sample-dev/cpu-sim", url: repos[3].url, language: "C++", color: colors["C++"], commits: 98 },
      { name: "sample-dev/campus-timetable", url: repos[2].url, language: "TypeScript", color: colors.TypeScript, commits: 61 },
    ],
    events,
    source: "sample",
  };
}
