import { useEffect } from "react";

const loaded = new Set<string>();

function loadFont(family: string) {
  if (!family || loaded.has(family)) return;
  loaded.add(family);
  const id = `gf-${family.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  const fam = family.replace(/\s+/g, "+");
  link.href = `https://fonts.googleapis.com/css2?family=${fam}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export function useApplyFonts(heading?: string, body?: string) {
  useEffect(() => {
    if (heading) loadFont(heading);
    if (body) loadFont(body);
    const root = document.documentElement;
    if (heading) root.style.setProperty("--font-heading", `'${heading}', system-ui, sans-serif`);
    if (body) root.style.setProperty("--font-body", `'${body}', system-ui, sans-serif`);
  }, [heading, body]);
}

export function preloadFont(family: string) {
  loadFont(family);
}
