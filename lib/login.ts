const LOGIN_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isValidLogin(login: string) {
  return LOGIN_RE.test(login);
}

export function parseYear(v: string | string[] | undefined, now = new Date()) {
  const y = Number(Array.isArray(v) ? v[0] : v);
  const cur = now.getFullYear();
  return Number.isInteger(y) && y >= 2008 && y <= cur ? y : cur;
}
