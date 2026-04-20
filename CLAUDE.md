# CLAUDE.md — FMC Executive Production Assistant

Read this file in full before making any changes. These are non-negotiable project rules.

## Project

- **App:** EPA (Executive Production Assistant)
- **Owner:** Ferguson Media Collective (FMC Studios)
- **Stack:** Next.js 15 / React 19 / TypeScript / Tailwind
- **Deploy:** Vercel (auto-deploys on push to main)
- **Repo:** ~/fmc-epa

## FMC Design System — Mandatory

Every UI element in this project must conform to the FMC Dev Brain design system. No exceptions.

### Palette

- Firestarter Red: #E03413 — accent ONLY. CTAs, active nav, logo mark, hover glow. Never as background fill. If more than 5% of visible surface is firestarter, it's overused.
- Burnished Copper: #B45F34 — warm secondary. Borders, subtle highlights, secondary glow.
- Carbon Core Black: #0D0D0D — primary background base.
- Steel Grey: #3E3E3E — muted text, disabled states, dividers.
- Retro Teal: #49797B — info states, secondary actions, links.
- Studio Off White: #F0EBE1 — primary text color, headings.

### Typography

Font: "Avenir Next", "Avenir", -apple-system, BlinkMacSystemFont, system-ui, sans-serif
- Bold (700): display headings, hero titles, CTAs
- Demi Bold (600): section headings, card titles, labels
- Medium (500): subheadings, nav items, body emphasis
- Regular (400): body text, descriptions, input values

Rules:
- Uppercase labels MUST have tracking-[0.15em]. Always.
- Display headings use tracking-tight.
- Never use Inter, Roboto, Arial, Barlow, Playfair, Bungee Shade, or Lora.
- Never use expanded tracking on body text.

### Background

```css
body {
  background:
    radial-gradient(ellipse 80% 60% at 50% 100%, rgba(224,52,19,0.18) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 20% 80%, rgba(180,95,52,0.10) 0%, transparent 55%),
    radial-gradient(ellipse 50% 30% at 80% 90%, rgba(224,52,19,0.08) 0%, transparent 50%),
    #0D0D0D;
  background-attachment: fixed;
}
```

Film grain overlay on body::after at opacity 0.035. Do not change the opacity.

### Glass Kit

- .glass-panel: bg white/[0.04], backdrop-blur(20px), border white/[0.06], rounded-2xl, shadow 0 8px 32px rgba(0,0,0,0.4)
- .glass-panel:hover: bg white/[0.07], border white/[0.12], + firestarter glow shadow 0 0 20px rgba(224,52,19,0.15)
- .glass-header: bg rgba(13,13,13,0.7), backdrop-blur(40px), sticky top-0 z-50
- .glass-input: bg white/[0.04], border white/[0.08], rounded-lg. Focus: border firestarter/40 + ring firestarter/15
- .glass-modal: backdrop-blur(40px), border white/[0.08], rounded-3xl

### Buttons

- .btn-firestarter: bg #E03413, white text, rounded-xl, glow shadow. Hover: translateY(-1px) + stronger glow. Active: scale(0.97).
- .btn-ghost: transparent bg, border white/[0.08], rounded-xl. Hover: bg white/[0.06]. Active: scale(0.97).

### Animation — Spring Physics ONLY

The ONLY timing function allowed is: cubic-bezier(0.34, 1.56, 0.64, 1)
- Standard: 0.3s
- Quick (micro-interactions): 0.15s
- Slow (modals, page transitions): 0.5s

NEVER use: ease, ease-in, ease-out, ease-in-out, linear, or any generic duration like 300ms without the spring curve.

Every clickable element must have: active:scale-[0.97]
Every interactive element must have a visible hover response (glow, border change, lift, opacity shift). If cursor passes over it and nothing happens, it's broken.

### Border Radius

- Cards/panels: rounded-2xl (16px)
- Buttons: rounded-xl (12px)
- Pills/tags: rounded-full
- Inputs: rounded-lg (8px)
- Modals: rounded-3xl (24px)

### Spacing

- Section gaps: gap-6 or space-y-6
- Card padding: p-5 (standard), p-4 (compact)
- Label to content: gap-2
- Nav items: gap-1 with py-2 px-3

## Anti-Patterns — NEVER Do These

### Color
- No slate-, zinc-, neutral-, blue- from Tailwind defaults
- No text-gray-*, bg-gray-*, border-gray-*
- Use text-white/[opacity], bg-white/[opacity], border-white/[opacity], or text-fmc-steel instead
- No firestarter as background fill

### Typography
- No Inter, Roboto, Arial, system-ui as primary font
- No default tracking on uppercase labels
- No expanded tracking on body text

### Animation
- No ease-in-out, ease, linear
- No static hover states
- No swapping chevron characters (rotate one SVG with spring)
- No snapping transitions — everything animates

### Layout
- No full-width inline expansions for detail views (use modal overlays)
- No headers that disappear on scroll without a glass bar replacing them
- No sidebar wider than w-56

### Vibe
- Must NOT feel like a "Claude wrapper" or generic SaaS dashboard
- Must NOT feel like DaVinci Resolve (too complex, needs a manual)
- Must feel like macOS/iOS — if an Apple designer would wince, revise
- No decorative elements that don't earn their place

## One-time setup

Run `npx tsx scripts/seed-glossary.ts` once after the first deploy to populate the
Glossary sheet tab. Brett/Corey can edit the sheet directly going forward.

## Commit Protocol

Every change gets its own commit with a descriptive message.
Always: git add -A && git commit -m "message" && git push origin main

## Do Not Break

- PDF generation pipeline (@react-pdf/renderer, html2pdf, API routes)
- Google Sheets logging
- Operator system (OperatorProvider)
- Existing API routes — extend, don't remove
- Environment variables — don't rename
- Logo files in /public/logos/
