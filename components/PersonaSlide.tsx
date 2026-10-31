import type { Dict } from "@/lib/i18n";
import type { PersonaId } from "@/lib/types";

/** The text of the persona slide. */
export function PersonaSlideContent({ persona, runnerUp, d }: { persona: PersonaId; runnerUp: PersonaId | null; d: Dict }) {
  const [title, desc] = d.persona(persona);
  return (
    <>
      <span className="eyebrow">{d.personaEyebrow}</span>
      <h2 className="mid" style={{ fontSize: "clamp(44px, 14vw, 72px)" }}>
        {title}
      </h2>
      <p className="lead">{desc}</p>
      <div className="spacer" />
      {runnerUp && <p className="lead">{d.runnerUp(d.persona(runnerUp)[0])}</p>}
    </>
  );
}
