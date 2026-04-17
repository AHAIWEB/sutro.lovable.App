import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

// Convert hex (#rrggbb) to "h s% l%" string for CSS HSL variable usage
function hexToHsl(hex: string): string | null {
  const m = hex.replace("#", "").match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return null;
  let r = parseInt(m[1], 16) / 255;
  let g = parseInt(m[2], 16) / 255;
  let b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Apply primary/accent colors from site_settings to CSS variables in real time. */
export function useThemeColors() {
  const { data: settings } = useSiteSettings();
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.primary_color) {
      const hsl = hexToHsl(settings.primary_color);
      if (hsl) {
        root.style.setProperty("--primary", hsl);
        root.style.setProperty("--ring", hsl);
        root.style.setProperty("--sidebar-primary", hsl);
        root.style.setProperty("--sidebar-ring", hsl);
      }
    }
    if (settings.accent_color) {
      const hsl = hexToHsl(settings.accent_color);
      if (hsl) root.style.setProperty("--accent", hsl);
    }
  }, [settings?.primary_color, settings?.accent_color]);
}

export { hexToHsl };
