export type Language = { name: string; color: string | null; size: number };

export type Repo = {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  languageColor: string | null;
  languages: Language[];
  private?: boolean;
};

export type ContribRepo = { name: string; url: string; language: string | null; color: string | null; commits: number; private?: boolean };

export type ActivityEvent = { type: string; createdAt: string; size: number };

export type CalendarDay = { date: string; count: number };

export type Totals = {
  total: number;
  commits: number;
  prs: number;
  issues: number;
  reviews: number;
  reposContributed: number;
  privateCount: number;
};

/** Everything we pull from GitHub, normalised so the stats engine never cares about the source. */
export type RawWrapped = {
  login: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  followers: number;
  repoCount: number;
  /** The year this covers, or 0 (ALL_TIME) for everything since the account was created. */
  year: number;
  repos: Repo[];
  calendar: CalendarDay[] | null;
  totals: Totals | null;
  topContribRepos: ContribRepo[];
  events: ActivityEvent[];
  source: "graphql" | "rest" | "sample";
  /** True when the signed-in user is looking at their own story. */
  viewer?: boolean;
  /** True when private contributions are counted. */
  includesPrivate?: boolean;
  /** True when private repo names and languages are included (the user granted the repo scope). */
  privateRepoDetails?: boolean;
};

export type PersonaId =
  | "night-owl"
  | "early-bird"
  | "weekend-warrior"
  | "streak-machine"
  | "polyglot"
  | "reviewer"
  | "open-sourcer"
  | "sprinter"
  | "builder";

export type LangShare = { name: string; color: string; share: number; value: number };

export type Stats = {
  login: string;
  name: string;
  avatarUrl: string | null;
  year: number;
  /** True for the All Time view (year is 0). */
  allTime: boolean;
  /** Contributions per calendar year, oldest first. Only filled for All Time. */
  yearTotals: { year: number; count: number }[];
  source: RawWrapped["source"];
  viewer: boolean;
  includesPrivate: boolean;
  privateRepoDetails: boolean;
  joinedYear: number;
  daysOnGitHub: number;
  followers: number;
  repoCount: number;
  stars: number;
  totals: Totals;
  heatmap: CalendarDay[];
  hasCalendar: boolean;
  activeDays: number;
  longestStreak: { days: number; start: string | null; end: string | null };
  busiestDay: CalendarDay | null;
  months: number[];
  busiestMonth: number | null;
  weekdays: number[];
  busiestWeekday: number | null;
  hours: number[];
  busiestHour: number | null;
  hasHours: boolean;
  languages: LangShare[];
  languageBasis: "bytes" | "repos";
  topRepos: Repo[];
  topContribRepos: ContribRepo[];
  persona: PersonaId;
  personaRunnerUp: PersonaId | null;
};
