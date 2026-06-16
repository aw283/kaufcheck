# immoampel Carousel — Design-System

Abgeleitet vom „Longevity Index" (AmritaVitality), umgesetzt auf immoampel mit **Navy + Ampel-Farben** statt Orange.

## Format
- **1080 × 1350 px** (Instagram-Portrait 4:5). Eine Kernaussage pro Slide, linksbündig, viel Weißraum.
- Export: SVG im Browser öffnen → Screenshot/PNG. Fonts via Google-Fonts-`@import` im `<style>` + Fallbacks.

## Farben (Tokens)
| Rolle | Hex |
|---|---|
| Light-BG | `#faf8f5` |
| Dark-BG (Navy) | `#0e1b3d` |
| Brand-Navy | `#1e3a8a` |
| Text dunkel | `#14213d` |
| Text grau (Light) | `#6b7280` |
| Text grau (Dark) | `#aeb6c6` |
| Grün (positiv/leistbar) | `#16a34a` |
| Amber (Achtung/Grenzfall) | `#f59e0b` |
| Rot (Risiko/Problem) | `#dc2626` |

**Akzent-Logik:** Grün = Chance/leistbar (Haupt-Akzent), Amber = Grenzfall, Rot = Risiko, Navy = neutral/Marke. Pro Slide EIN Akzent; Findings-Liste mehrfarbig (je Item ein farbiger Balken links).

## Typo
- Display: **Instrument Serif** (Fallback Georgia, serif) — Headline 88–150px, Big-Number bis 320px.
- Body/Labels: **Inter** (Fallback system-ui), grau.
- Eyebrow: kurzer Strich (40px) + UPPERCASE getrackt, Akzentfarbe, ~14px.

## Feste Elemente
- **Lockup oben links:** „immoampel" (Serif; „immo" navy/weiß, „ampel" grün) + darunter `IMMOAMPEL.AT` (10–12px, getrackt, grau).
- **Progress-Dots oben rechts:** so viele wie Slides; aktiver gefüllt, Rest gedämpft.
- **Footer mittig:** dezent, z. B. `Jetzt prüfen → immoampel.at` bzw. `WEITERSWIPEN →`.
- Light-Slides: zarte konzentrische Kreise oben rechts. Dark-Slides: feines Raster + weicher Glow.

## Slide-Archetypen
1. Cover/Hook (Dark) · 2. Stat/Big-Number (Light) · 3. Findings-Liste (Light, mehrfarbig) · 4. Vergleich/Balken · 5. CTA (Solid).

Beispiel: `eigenkapital/` (slide-01 Cover, slide-02 Findings, slide-03 CTA).
Echte Zahlen immer mit Quelle. Ehrlich, kein Hype, keine Renditeversprechen.
