import type { PersonaId } from "@/lib/types";

export type Palette = "cobalt" | "tomato" | "saffron" | "teal" | "pink" | "plum" | "moss" | "ink" | "sky" | "home";

/** [background, text] for each slide palette. */
export const COLORS: Record<Palette, [string, string]> = {
  cobalt: ["var(--cobalt)", "var(--paper)"],
  tomato: ["var(--tomato)", "var(--ink)"],
  saffron: ["var(--saffron)", "var(--ink)"],
  teal: ["var(--teal)", "var(--paper)"],
  pink: ["var(--pink)", "var(--ink)"],
  plum: ["var(--plum)", "var(--paper)"],
  moss: ["var(--moss)", "var(--paper)"],
  ink: ["var(--ink)", "var(--paper)"],
  sky: ["var(--sky)", "#ffffff"],
  /** The landing page black, used by the summary slide too. */
  home: ["var(--home)", "var(--paper)"],
};

/** Every personality. */
export const PERSONA_IDS: PersonaId[] = [
  "night-owl",
  "early-bird",
  "weekend-warrior",
  "streak-machine",
  "polyglot",
  "reviewer",
  "open-sourcer",
  "sprinter",
  "builder",
];

/** The persona slide takes the colour that suits its personality; its animated backdrop is in PersonaBackdrop.tsx. */
export const PERSONA_PALETTE: Record<PersonaId, Palette> = {
  "night-owl": "ink",
  "early-bird": "pink",
  "weekend-warrior": "sky",
  "streak-machine": "tomato",
  polyglot: "saffron",
  reviewer: "moss",
  "open-sourcer": "plum",
  sprinter: "cobalt",
  builder: "ink",
};
