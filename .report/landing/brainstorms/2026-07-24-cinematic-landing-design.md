# Cinematic Landing Page — WinDe

**Date:** 2026-07-24  
**Direction:** A (scroll story) + light B (ExploreOrb interaction)  
**Out of scope:** Evaluation/reviews, generic feature grids, stats strips

## Goal

Make `/` feel like a product story: Quick Challenge → diagnosis → personalized plan — not a cookie-cutter marketing page.

## Page structure

1. **Hero** — Brand-first (`WinDe`), one headline, one supporting line, dual CTA (primary: Quick Challenge / scroll to start; secondary: explore exams). Quick Challenge visual as statement (gauge-led), not a dense dashboard.
2. **JourneySection** — Three full-width cinematic beats (timer → skill radar → plan timeline), scroll-triggered motion, mock visuals only.
3. **ExploreOrb** — Keep orbital picker; copy aligned to story (“Chọn kỳ thi của bạn”).
4. **ClosingCta** — One strong line + one CTA. No testimonials.

## Visual system

- Brand: deep teal `#042f2e`, teal accents, amber unique `#f59e0b`
- Motion: framer-motion `whileInView`, 2–3 intentional animations per section
- Avoid: card grids of features, purple gradients, cream+serif terracotta look

## Implementation notes

- Replace `ProcessSection` usage on HomePage with `JourneySection`
- Add `ClosingCta`
- Light Hero + ExploreOrb copy/CTA polish
- Do not wire Evaluation
