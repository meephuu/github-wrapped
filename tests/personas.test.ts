import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { COLORS, PERSONA_IDS, PERSONA_PALETTE } from "@/components/palette";
import { PersonaBackdrop } from "@/components/PersonaBackdrop";
import { t } from "@/lib/i18n";

describe("personas", () => {
  it("lists every personality once, each with a palette and a name in both languages", () => {
    expect(new Set(PERSONA_IDS).size).toBe(PERSONA_IDS.length);
    expect(PERSONA_IDS).toHaveLength(9);
    for (const id of PERSONA_IDS) {
      expect(COLORS[PERSONA_PALETTE[id]]).toBeDefined();
      for (const lang of ["en", "th"] as const) expect(t(lang).persona(id)[0].length).toBeGreaterThan(0);
    }
  });

  it("has its own backdrop for each personality", () => {
    const html = PERSONA_IDS.map((id) => renderToStaticMarkup(createElement(PersonaBackdrop, { id })));
    PERSONA_IDS.forEach((id, i) => expect(html[i]).toContain(`pfx-${id}`));
    // every look is different markup, not one backdrop reused
    expect(new Set(html).size).toBe(PERSONA_IDS.length);
  });
});
