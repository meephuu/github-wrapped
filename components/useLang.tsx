"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

const KEY = "gw-lang";

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    const urlLang = new URLSearchParams(location.search).get("lang");
    const pick = urlLang || saved || (navigator.language.startsWith("th") ? "th" : "en");
    if (pick === "th" || pick === "en") setLang(pick);
  }, []);
  const set = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {}
    document.documentElement.lang = l;
  };
  return [lang, set];
}

export function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="langtoggle" role="group" aria-label="Language">
      {(["en", "th"] as const).map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => onChange(l)}>
          <span>{l === "en" ? "EN" : "ไทย"}</span>
        </button>
      ))}
    </div>
  );
}
