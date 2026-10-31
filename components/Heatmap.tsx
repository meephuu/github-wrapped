import type { CalendarDay } from "@/lib/types";

/** Splits non-zero counts into 4 intensity levels using quartiles, like GitHub's own calendar. */
function levels(days: CalendarDay[]) {
  const nz = days.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  const q = (p: number) => nz[Math.min(nz.length - 1, Math.floor(p * nz.length))] ?? 0;
  const [a, b, c] = [q(0.25), q(0.5), q(0.75)];
  return (n: number) => (n <= 0 ? 0 : n <= a ? 1 : n <= b ? 2 : n <= c ? 3 : 4);
}

export function Heatmap({ days, monthLabels, minWeeks = 0 }: { days: CalendarDay[]; monthLabels?: string[]; minWeeks?: number }) {
  if (!days.length) return null;
  const level = levels(days);
  const first = new Date(days[0].date + "T00:00:00Z").getUTCDay();
  const weeks = Math.max(minWeeks, Math.ceil((first + days.length) / 7));
  const cells = [...Array(first).fill(null), ...days];
  while (cells.length < weeks * 7) cells.push(null);
  return (
    <div className="heatwrap">
      <div className="heat" style={{ aspectRatio: `${weeks} / 7` }} role="img" aria-label="Contribution calendar">
        {cells.map((d, i) =>
          d ? <i key={d.date} className={`l${level(d.count)}`} title={`${d.date}: ${d.count}`} /> : <i key={`p${i}`} className="pad" />,
        )}
      </div>
      {monthLabels && (
        <div className="heatmonths">
          {monthLabels.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function HeatLegend({ less, more }: { less: string; more: string }) {
  return (
    <div className="legend">
      <span>{less}</span>
      {[10, 32, 55, 78, 100].map((p) => (
        <i key={p} style={{ background: `color-mix(in srgb, currentColor ${p}%, transparent)` }} />
      ))}
      <span>{more}</span>
    </div>
  );
}
