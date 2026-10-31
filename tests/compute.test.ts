import { describe, expect, it } from "vitest";
import { compute, localParts, longestStreak } from "@/lib/compute";
import { sampleRaw } from "@/lib/sample";
import type { RawWrapped } from "@/lib/types";

const now = new Date("2026-10-31T03:00:00Z");

describe("longestStreak", () => {
  it("finds the longest run of consecutive active days", () => {
    const days = [
      { date: "2026-01-01", count: 1 }, { date: "2026-01-02", count: 3 }, { date: "2026-01-03", count: 0 },
      { date: "2026-01-04", count: 1 }, { date: "2026-01-05", count: 1 }, { date: "2026-01-06", count: 2 },
    ];
    expect(longestStreak(days)).toEqual({ days: 3, start: "2026-01-04", end: "2026-01-06" });
  });
  it("handles an empty year", () => {
    expect(longestStreak([]).days).toBe(0);
  });
  it("crosses month boundaries", () => {
    expect(longestStreak([{ date: "2026-01-31", count: 1 }, { date: "2026-02-01", count: 1 }]).days).toBe(2);
  });
});

describe("localParts", () => {
  it("converts to the viewer's time zone", () => {
    expect(localParts("2026-10-30T17:30:00Z", "Asia/Bangkok")).toEqual({ hour: 0, weekday: 6 });
    expect(localParts("2026-10-30T17:30:00Z", "UTC").hour).toBe(17);
  });
});

describe("compute: All Time", () => {
  const raw: RawWrapped = {
    ...sampleRaw(2026, now),
    year: 0,
    calendar: [
      { date: "2024-12-30", count: 2 }, { date: "2024-12-31", count: 1 },
      { date: "2025-01-01", count: 4 }, { date: "2025-06-10", count: 0 },
      { date: "2026-03-03", count: 5 },
    ],
    totals: null,
  };
  const s = compute(raw, { now });

  it("totals each calendar year, oldest first", () => {
    expect(s.allTime).toBe(true);
    expect(s.yearTotals).toEqual([{ year: 2024, count: 3 }, { year: 2025, count: 4 }, { year: 2026, count: 5 }]);
  });
  it("finds streaks across year boundaries", () => {
    expect(s.longestStreak).toEqual({ days: 3, start: "2024-12-30", end: "2025-01-01" });
  });
  it("leaves yearTotals empty for a single year", () => {
    expect(compute(sampleRaw(2026, now), { now }).yearTotals).toEqual([]);
  });
});

describe("compute", () => {
  const s = compute(sampleRaw(2026, now), { timeZone: "Asia/Bangkok", now });

  it("summarises the sample year", () => {
    expect(s.hasCalendar).toBe(true);
    expect(s.heatmap.at(-1)!.date <= "2026-10-31").toBe(true);
    expect(s.longestStreak.days).toBeGreaterThanOrEqual(23);
    expect(s.totals.total).toBe(s.heatmap.reduce((a, d) => a + d.count, 0));
    expect(s.months.reduce((a, b) => a + b, 0)).toBe(s.totals.total);
  });
  it("ranks languages by bytes", () => {
    expect(s.languageBasis).toBe("bytes");
    expect(s.languages[0].name).toBe("TypeScript");
    expect(s.languages.reduce((a, l) => a + l.share, 0)).toBeLessThanOrEqual(1.0001);
  });
  it("spots the night owl in the sample", () => {
    expect(s.busiestHour === null || s.busiestHour >= 21 || s.busiestHour <= 3).toBe(true);
    expect(s.persona).toBe("night-owl");
  });
  it("orders top repos by stars", () => {
    expect(s.topRepos.map((r) => r.name)).toEqual(["togethr-api", "tiny-db", "campus-timetable"]);
  });

  it("falls back to events when there is no calendar", () => {
    const raw: RawWrapped = {
      ...sampleRaw(2026, now), calendar: null, totals: null, source: "rest",
      repos: [{ name: "a", description: null, url: "", stars: 0, forks: 0, language: "Go", languageColor: null, languages: [] }],
      events: [
        { type: "PushEvent", createdAt: new Date(now.getTime() - 864e5).toISOString(), size: 3 },
        { type: "PullRequestEvent", createdAt: new Date(now.getTime() - 2 * 864e5).toISOString(), size: 1 },
      ],
    };
    const r = compute(raw, { now });
    expect(r.hasCalendar).toBe(false);
    expect(r.totals).toMatchObject({ commits: 3, prs: 1, total: 4 });
    expect(r.languageBasis).toBe("repos");
    expect(r.languages[0]).toMatchObject({ name: "Go", color: "#00ADD8", share: 1 });
    expect(r.heatmap.length).toBe(90);
  });

  it("copes with a brand-new account with no activity", () => {
    const raw: RawWrapped = { ...sampleRaw(2026, now), repos: [], events: [], calendar: [], totals: { total: 0, commits: 0, prs: 0, issues: 0, reviews: 0, reposContributed: 0, privateCount: 0 } };
    const r = compute(raw, { now });
    expect(r.busiestDay).toBeNull();
    expect(r.busiestHour).toBeNull();
    expect(r.persona).toBe("builder");
  });
});
