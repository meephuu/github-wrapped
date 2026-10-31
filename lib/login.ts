const LOGIN_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isValidLogin(login: string) {
  return LOGIN_RE.test(login);
}

/** The "All Time" choice in the year picker: everything since the account was created. Stored as year 0. */
export const ALL_TIME = 0;

/** How a year choice is written in URLs: "2026", or "all" for All Time. */
export const yearParam = (year: number) => (year === ALL_TIME ? "all" : String(year));

export function parseYear(v: string | string[] | undefined, now = new Date()) {
  const raw = Array.isArray(v) ? v[0] : v;
  if (raw === "all") return ALL_TIME;
  const y = Number(raw);
  const cur = now.getFullYear();
  return Number.isInteger(y) && y >= 2008 && y <= cur ? y : cur;
}
