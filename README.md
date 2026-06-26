# Greenline HSE — website

Single-page marketing site built from the *Greenline HSE White Paper* (Part II brief).
Astro + GSAP/ScrollTrigger/SplitText + Lenis. Static, fast, SEO-friendly, WCAG-minded.

## Run

```bash
npm install
npm run dev      # local dev at http://localhost:4321
npm run build    # static output to dist/
npm run preview  # preview the production build
```

Deploy `dist/` to Vercel / Netlify / Cloudflare Pages.

## Structure

- `src/pages/index.astro` — assembles the page in the §12 section order.
- `src/components/` — one component per section (Hero, SafetyReality + StatBand,
  ComplianceGap, MeetGreenline, Services, AreasOfWork, BusinessCase, Contact, Footer,
  Header, ThroughLine, plus `LineIcon` and `Placeholder` helpers).
- `src/styles/global.css` — the design system: palette, type scale, components.
- `src/scripts/motion.js` — all GSAP motion, wrapped in `gsap.matchMedia()` with a
  full `prefers-reduced-motion` fallback. UI behaviour (nav, form) runs regardless.
- `src/layouts/Base.astro` — `<head>`, fonts, Open Graph/Twitter cards, schema.org
  (`ProfessionalService` + `Person` with credentials).

## Two things to wire up before launch

1. **Image slots (§13).** Every image is a clearly-labelled placeholder showing its
   source prompt and aspect ratio. Generate the assets separately, then replace each
   `<Placeholder>` with a lazy-loaded `<img loading="lazy" …>` (or `<picture>`):
   - Meet Greenline → prompt **#3** (still life, 4:5) and **#4** (Mayo farmland, 3:2)
   - Construction flagship → prompt **#5** (16:9)
   - Agriculture secondary → prompt **#7** (3:2)
   - Optional hero photo → prompt **#1**; data band / icons can use **#DATA / #ICONS / #SECTORS**.
   The custom thin-line service & sector icons are drawn in-code (`LineIcon.astro`) as
   the line-motif design language; swap for the refined #ICONS/#SECTORS set if desired.

2. **Contact form endpoint.** `Contact.astro`'s `<form action="#">` currently shows an
   inline confirmation. Point `action` at an email endpoint (Formspree, Netlify Forms,
   etc.) to receive enquiries. Also fill the bracketed placeholders: phone, ABN, and
   confirm the email address.

## Notes

- One cohesive palette throughout; the two areas of work differ by content/layout, not
  colour. Two deliberate dark moments only: the stat band and the closing green band.
- Copy is verbatim from Part I. `site` in `astro.config.mjs` is set to the production
  domain — update if it changes (drives canonical URLs and OG tags).
