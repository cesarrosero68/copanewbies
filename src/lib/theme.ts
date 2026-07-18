// Theme helpers for per-edition appearance customization.

export function hexToHsl(hex: string): string | null {
  if (!hex) return null;
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let sat = 0;
  const lig = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = lig > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue /= 6;
  }
  return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(lig * 100)}%`;
}

const FONT_MAP: Record<string, string> = {
  inter: "'Inter', system-ui, sans-serif",
  roboto: "'Roboto', system-ui, sans-serif",
  montserrat: "'Montserrat', system-ui, sans-serif",
  oswald: "'Oswald', system-ui, sans-serif",
  "bebas neue": "'Bebas Neue', system-ui, sans-serif",
  bebas: "'Bebas Neue', system-ui, sans-serif",
};

function ensureFontLink(family: string) {
  const key = family.toLowerCase();
  const id = `edition-font-${key.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  const familyParam = family
    .split(" ")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("+");
  link.href = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export interface EditionTheme {
  primary_color?: string | null;
  header_color?: string | null;
  footer_color?: string | null;
  bg_color?: string | null;
  title_color?: string | null;
  text_color?: string | null;
  font_family?: string | null;
  font_size?: string | null;
  hero_color?: string | null;
}

export function applyEditionTheme(t: EditionTheme) {
  const root = document.documentElement;

  if (t.primary_color) {
    const hsl = hexToHsl(t.primary_color);
    if (hsl) {
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
    }
  }
  if (t.bg_color) {
    const hsl = hexToHsl(t.bg_color);
    if (hsl) root.style.setProperty("--background", hsl);
  }
  if (t.text_color) {
    const hsl = hexToHsl(t.text_color);
    if (hsl) root.style.setProperty("--foreground", hsl);
  }

  // Custom (non-shadcn) vars — raw hex
  if (t.header_color) root.style.setProperty("--header-bg", t.header_color);
  if (t.footer_color) root.style.setProperty("--footer-bg", t.footer_color);
  if (t.hero_color) root.style.setProperty("--hero-bg", t.hero_color);
  if (t.title_color) root.style.setProperty("--title-color", t.title_color);

  if (t.font_size) {
    document.body.style.fontSize = `${t.font_size}px`;
  }
  if (t.font_family) {
    const key = t.font_family.toLowerCase();
    const stack = FONT_MAP[key] || `'${t.font_family}', system-ui, sans-serif`;
    ensureFontLink(key === "bebas" ? "Bebas Neue" : t.font_family);
    document.body.style.fontFamily = stack;
  }
}

export const FONT_OPTIONS = [
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "montserrat", label: "Montserrat" },
  { value: "oswald", label: "Oswald" },
  { value: "bebas neue", label: "Bebas Neue" },
];