"use client";

import { useEffect } from "react";

let originalThemeColor: string | null = null;

function themeMeta() {
  return document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
}

/**
 * The story fills the screen, so paint everything around it (the page behind, the overscroll area and the
 * browser's own bar via theme-color) the same colour as the current screen. `color` is a CSS colour or a
 * `var(--token)`.
 */
export function usePageColor(color: string) {
  useEffect(() => {
    const root = document.documentElement;
    const token = /^var\((--[\w-]+)\)$/.exec(color)?.[1];
    const resolved = token ? getComputedStyle(root).getPropertyValue(token).trim() : color;
    root.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
    const meta = themeMeta();
    if (meta) {
      originalThemeColor ??= meta.content;
      meta.content = resolved || meta.content;
    }
  }, [color]);

  useEffect(
    () => () => {
      document.documentElement.style.removeProperty("background-color");
      document.body.style.removeProperty("background-color");
      const meta = themeMeta();
      if (meta && originalThemeColor) meta.content = originalThemeColor;
    },
    [],
  );
}
