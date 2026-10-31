"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ALL_TIME, isValidLogin, yearParam } from "@/lib/login";
import { t, type Dict } from "@/lib/i18n";
import Loading from "./Loading";
import { usePageColor } from "./usePageColor";
import { LangToggle, useLang } from "./useLang";

type Me = { login: string; avatarUrl: string | null; privateRepos: boolean } | null;

function errorText(d: Dict, error?: string, user?: string) {
  switch (error) {
    case undefined:
    case "":
      return "";
    case "notfound":
      return d.errNotFound(user ?? "");
    case "rate":
      return d.errRate;
    case "auth":
      return d.errAuth;
    case "signin":
      return d.errSignin;
    case "authsetup":
      return d.errAuthSetup;
    default:
      return d.errNetwork;
  }
}

function GitHubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/** Error banner: a magnifier that keeps looking around for "user not found", a warning sign for anything else. */
function ErrorNote({ text, lens }: { text: string; lens: boolean }) {
  return (
    <div className="errbox">
      <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {lens ? (
          <g className="lens">
            <circle cx="10" cy="10" r="6.5" />
            <path d="M15 15l5.5 5.5" />
            <path className="q" d="M8.2 8.3a1.9 1.9 0 113.4.9c-.5.8-1.6 1-1.6 2.1M10 13.3v.1" />
          </g>
        ) : (
          <g className="alert">
            <path d="M12 3l9.5 17h-19z" />
            <path d="M12 9.5v5M12 17.5v.1" />
          </g>
        )}
      </svg>
      <p>{text}</p>
    </div>
  );
}

export default function Landing({
  error,
  detail,
  prefill,
  authEnabled,
  me,
}: {
  error?: string;
  detail?: string;
  prefill?: string;
  authEnabled: boolean;
  me: Me;
}) {
  const router = useRouter();
  const [lang, setLang] = useLang();
  const d = t(lang);
  const thisYear = new Date().getFullYear();
  const [login, setLogin] = useState(prefill ?? "");
  const [year, setYear] = useState(thisYear);
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const msg = formMsg ?? errorText(d, error, prefill);
  usePageColor("var(--home)");

  // Shake the field whenever there is something to correct.
  const fieldRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!msg) return;
    fieldRef.current?.animate(
      ["0", "-10px", "9px", "-6px", "4px", "0"].map((x) => ({ transform: `translateX(${x})` })),
      { duration: 500, delay: 350, easing: "ease-in-out" },
    );
  }, [msg]);

  // Show the loading screen briefly before navigating, so the transition always feels deliberate
  // (the page itself then takes however long the GitHub fetch needs).
  const go = (url: string) => {
    if (busy) return;
    setBusy(true);
    setTimeout(() => router.push(url), 1800);
  };

  return (
    <div className="stage" style={{ background: "var(--ground)" }}>
      <div className="start rise">
        <div className="toprow">
          <span className="eyebrow">{d.eyebrow(thisYear)}</span>
          <LangToggle lang={lang} onChange={setLang} />
        </div>
        <h1>
          GitHub
          <br />
          <em>Wrapped</em>
        </h1>
        <p className="lead">{d.lead}</p>

        {!authEnabled && (
          <div className="peek">
            {[d.contributions, d.streakEyebrow, d.langEyebrow, d.personaEyebrow].map((c) => (
              <span className="chip" key={c}>
                {c}
              </span>
            ))}
          </div>
        )}

        <div className="spacer" />

        {authEnabled && me && (
          <div className="signin">
            <div className="me">
              {me.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.avatarUrl} alt="" />
              ) : null}
              <span>{d.signedInAs(me.login)}</span>
              <form action="/auth/logout" method="post">
                <button className="linkbtn" type="submit">
                  {d.signOut}
                </button>
              </form>
            </div>
            <a
              className="btn accent big-btn"
              href={`/me?year=${yearParam(year)}`}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                go(`/me?year=${yearParam(year)}`);
              }}
            >
              {d.seeMine}
            </a>
          </div>
        )}

        {authEnabled && !me && (
          <div className="signin">
            <a className="btn gh big-btn" href={`/auth/login?year=${yearParam(year)}&private=1`}>
              <GitHubMark />
              {d.signIn}
            </a>
            <p className="small">{d.signInWhy}</p>
          </div>
        )}

        <form
          className="form"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            const u = login.trim().replace(/^@/, "");
            if (!isValidLogin(u)) return setFormMsg(d.invalidUser);
            setFormMsg(null);
            go(`/u/${u}?year=${yearParam(year)}`);
          }}
        >
          <label className="eyebrow" htmlFor="user">
            {authEnabled ? d.or : d.usernameLabel}
          </label>
          <div className="field" ref={fieldRef}>
            <span>@</span>
            <input
              id="user"
              name="user"
              placeholder={d.usernamePlaceholder}
              spellCheck={false}
              autoCapitalize="off"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
            <button className="btn" type="submit" disabled={busy}>
              {d.wrapIt}
            </button>
          </div>
          <div className="yearrow">
            <span className="eyebrow">{d.yearLabel}</span>
            <div className="year" role="group" aria-label={d.yearLabel}>
              <button
                type="button"
                aria-label={d.yearPrev}
                disabled={year !== ALL_TIME && year <= thisYear - 5}
                onClick={() => setYear(year === ALL_TIME ? thisYear : year - 1)}
              >
                ‹
              </button>
              <b aria-live="polite">{year === ALL_TIME ? d.allTime : year}</b>
              <button
                type="button"
                aria-label={d.yearNext}
                disabled={year === ALL_TIME}
                onClick={() => setYear(year === thisYear ? ALL_TIME : year + 1)}
              >
                ›
              </button>
            </div>
          </div>
          <div aria-live="polite">
            {msg && <ErrorNote key={msg} text={msg} lens={!formMsg && error === "notfound"} />}
            {detail && !formMsg && <code className="detail">{detail}</code>}
          </div>
        </form>
      </div>
      {busy && <Loading steps={d.loadingSteps} />}
    </div>
  );
}
