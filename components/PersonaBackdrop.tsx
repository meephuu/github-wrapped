import type { CSSProperties, ReactNode } from "react";
import type { PersonaId } from "@/lib/types";

/** Sets CSS custom properties (and plain styles) inline. All values are deterministic so server and client agree. */
const cv = (o: Record<string, string | number>) => o as CSSProperties;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

const STAR_POINTS = "12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6";
const BALLOON_COLORS = ["var(--saffron)", "var(--tomato)", "var(--pink)", "var(--teal)", "var(--cobalt)", "var(--plum)"];
const BLOCK_COLORS = ["var(--saffron)", "var(--tomato)", "var(--pink)", "var(--teal)", "var(--cobalt)", "var(--paper)"];
const GLYPHS = ["{ }", "</>", "=>", "λ", "::", "[ ]", "#!", "fn", "def", "&&", "0x", "<T>", "async", ";"];
// Blocks per column of the stack the Builder drops; a block sits on the one below it.
const STACK = [3, 2, 4, 1, 3, 2];
const BLOCKS = STACK.flatMap((h, c) => range(h).map((r) => ({ c, r })));
// Where the Reviewer's check marks pop up (top %, left %) as the scan line passes.
const CHECKS = [
  [18, 80],
  [33, 70],
  [47, 84],
  [62, 72],
  [76, 82],
];
const SCAN_SECONDS = 4.5;

/** One animated backdrop per personality, shown behind the persona slide. Styles: .pfx-* in globals.css. */
const BODY: Record<PersonaId, () => ReactNode> = {
  // Twinkling stars, a crescent moon floating up from below, and the odd shooting star.
  "night-owl": () => (
    <>
      {range(30).map((i) => (
        <b
          key={i}
          className="p-star"
          style={cv({ left: `${(i * 37 + 11) % 97}%`, top: `${(i * 53 + 7) % 84}%`, "--s": `${2 + ((i * 3) % 4)}px`, "--d": `${-(i % 7) * 0.6}s`, "--t": `${2 + (i % 5) * 0.7}s` })}
        />
      ))}
      <span className="p-shoot" />
      <div className="pwrap">
        <span className="p-moon" />
      </div>
    </>
  ),

  // A sun rising behind slowly turning rays, with clouds drifting past.
  "early-bird": () => (
    <>
      {[
        [14, 26, 0],
        [34, 38, -14],
        [58, 30, -7],
      ].map(([y, t, d], i) => (
        <span key={i} className="p-cloud" style={cv({ "--y": `${y}%`, "--t": `${t}s`, "--d": `${d}s` })} />
      ))}
      <div className="pwrap">
        <span className="p-rays" />
        <span className="p-sun" />
      </div>
    </>
  ),

  // Party balloons drifting up.
  "weekend-warrior": () => (
    <div className="pwrap">
      {range(10).map((i) => (
        <span
          key={i}
          className="p-balloon"
          style={cv({
            "--l": `${(i * 31 + 4) % 88}%`,
            "--c": BALLOON_COLORS[i % BALLOON_COLORS.length],
            "--t": `${9 + ((i * 5) % 7)}s`,
            "--d": `${-((i * 7) % 12)}s`,
            "--x": `${((i * 29) % 60) - 30}px`,
          })}
        />
      ))}
    </div>
  ),

  // Rows of "days" marching past, one after another, never skipping a beat.
  "streak-machine": () => (
    <>
      {range(5).map((i) => (
        <span
          key={i}
          className={`p-belt${i === 1 || i === 3 ? " lit" : ""}`}
          style={cv({ "--y": `${54 + i * 9}%`, "--dir": i % 2 ? -1 : 1, "--t": `${5 + (i % 3) * 1.8}s` })}
        />
      ))}
    </>
  ),

  // Code symbols from many languages floating up and tumbling.
  polyglot: () => (
    <div className="pwrap">
      {range(16).map((i) => (
        <span
          key={i}
          className="p-glyph"
          style={cv({
            "--l": `${(i * 29 + 5) % 86}%`,
            "--s": `${20 + ((i * 11) % 30)}px`,
            "--t": `${8 + ((i * 3) % 6)}s`,
            "--d": `${-((i * 5) % 11)}s`,
            "--x": `${((i * 37) % 80) - 40}px`,
            "--r0": `${((i * 19) % 40) - 20}deg`,
            "--r1": `${((i * 47) % 120) - 60}deg`,
          })}
        >
          {GLYPHS[i % GLYPHS.length]}
        </span>
      ))}
    </div>
  ),

  // Lines of code, a scan line sweeping down them, and check marks appearing as it passes.
  reviewer: () => (
    <>
      <div className="pwrap">
        <div className="p-code">
          {range(17).map((i) => (
            <i key={i} style={cv({ "--w": `${28 + ((i * 23) % 60)}%`, "--in": `${i % 4 === 0 ? 0 : i % 4 === 1 ? 6 : i % 4 === 2 ? 12 : 6}%` })} />
          ))}
        </div>
        {CHECKS.map(([top, left], i) => (
          <svg key={i} className="p-check" viewBox="0 0 24 24" style={cv({ top: `${top}%`, left: `${left}%`, "--d": `${(SCAN_SECONDS * 0.8 * top) / 100 - 0.3}s` })}>
            <circle cx="12" cy="12" r="11" fill="currentColor" />
            <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="var(--moss)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ))}
      </div>
      <span className="p-scan" />
    </>
  ),

  // Stars (as in GitHub stars) rising and glowing around a big slowly turning outline.
  "open-sourcer": () => (
    <div className="pwrap">
      <svg className="p-bigstar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinejoin="round">
        <polygon points={STAR_POINTS} />
      </svg>
      {range(14).map((i) => (
        <svg
          key={i}
          className="p-rstar"
          viewBox="0 0 24 24"
          style={cv({
            "--l": `${(i * 31 + 6) % 90}%`,
            "--s": `${14 + ((i * 13) % 28)}px`,
            "--t": `${8 + ((i * 3) % 6)}s`,
            "--d": `${-((i * 5) % 10)}s`,
            "--x": `${((i * 41) % 70) - 35}px`,
            "--r": `${i % 2 ? 200 : -200}deg`,
          })}
        >
          <polygon points={STAR_POINTS} fill="currentColor" />
        </svg>
      ))}
    </div>
  ),

  // Speed lines rushing past, with a flash at the start.
  sprinter: () => (
    <>
      <span className="p-flash" />
      {range(18).map((i) => (
        <span
          key={i}
          className="p-dash"
          style={cv({
            "--y": `${(i * 37 + 5) % 96}%`,
            "--w": `${70 + ((i * 53) % 190)}px`,
            "--h": `${2 + (i % 3)}px`,
            "--t": `${0.7 + ((i * 3) % 8) * 0.12}s`,
            "--d": `${-((i * 7) % 13) * 0.1}s`,
          })}
        />
      ))}
    </>
  ),

  // Blocks dropping in and stacking up, then the stack clears and starts again.
  builder: () => (
    <div className="pwrap">
      {BLOCKS.map(({ c, r }, i) => (
        <span key={i} className="p-block" style={cv({ "--c": c, "--r": r, "--bc": BLOCK_COLORS[(c + r * 2) % BLOCK_COLORS.length] })} />
      ))}
    </div>
  ),
};

export function PersonaBackdrop({ id }: { id: PersonaId }) {
  return (
    <div className={`fx pfx pfx-${id}`} aria-hidden>
      {BODY[id]()}
    </div>
  );
}
