# Implementation Plan: Landing + Footer Polish (Micro)

## 📌 User Request (VERBATIM)
> Create a concise micro-implementation plan for these changes on Project-exam frontend.
>
> Workspace: `/home/thangnd05/Project-exam`
>
> ## Requirements (from user + prior design advice)
> 1. Temporarily remove Evaluation section from landing (`HomePage.js`) — keep Evaluation component files, just don't render it
> 2. Restyle Footer to match clean near-white page aesthetic (`#f8fafc` body). Current footer is heavy blue gradient with orbs — wrong for new clean look. Convert to light footer: white/#f8fafc surface, dark text, subtle top border, keep brand blue accents for links/logo. Remove or neutralize blue orbs/grid decor.
> 3. Apply GreenNode-inspired quick wins to landing:
>    - Hero: shorter copy — brand-first headline, ONE short supporting sentence with keyword emphasis, primary CTA can stay "Khám phá ngay" or become "Bắt đầu luyện" scrolling to exam types; keep Quick Challenge visual as interactive dominant visual; reduce badge competition if needed
>    - Process: already good — minor polish only if needed (clearer hierarchy)
>    - Add a small closing dual-CTA section before footer ends on landing only OR after Process on HomePage: primary "Bắt đầu luyện" (scroll to #exam-types) + secondary outline "Xem Quick Challenge" (scroll to hero / focus quick) — keep simple, one composition, no card clutter, English code comments if any
>
> ## Constraints
> - Follow existing patterns (classNames/bind, scss modules, ButtonPrime, framer-motion)
> - Vietnamese UI copy
> - Code/comments English
> - Do not delete Evaluation feature files
> - Do not restore BackgroundDecor
> - Keep scope to landing + footer
>
> ## Return
> A numbered checklist of exact files to edit and what to change in each. No code implementation — plan only.

## 🎯 Acceptance Criteria (Derived from User Request)

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC1 | Evaluation section not rendered on landing; Evaluation files remain on disk | Home page has no Evaluation UI; `Evaluation/` folder still exists |
| AC2 | Footer is light (white/#f8fafc), dark text, subtle top border; no heavy blue gradient/orbs/grid | Visual check footer vs `#f8fafc` body; brand blue only on accents |
| AC3 | Hero has brand-first short headline + one supporting sentence with keyword emphasis; Quick Challenge stays dominant visual | Hero copy length reduced; QC carousel still primary right/visual |
| AC4 | Primary hero CTA scrolls to `#exam-types` (label "Khám phá ngay" or "Bắt đầu luyện") | Click scrolls to `ExamTypePage` root `id="exam-types"` |
| AC5 | Closing dual-CTA on landing only: primary → `#exam-types`, secondary outline → hero/quick | Section appears after Process (or before footer); both scrolls work |
| AC6 | Process unchanged except optional minor hierarchy polish | No redesign; optional spacing/weight tweaks only |
| AC7 | Patterns: classNames/bind, scss modules, ButtonPrime, framer-motion; VN copy; EN comments; no BackgroundDecor; scope landing+footer | Code review against constraints |

## 📋 Context Summary

**Architecture**
- Landing entry: `frontend/src/features/landing/HomePage.js` (exported as `TestPage`) — sections: Hero → ExamTypePage → Process → Evaluation
- Footer is **global layout**: `frontend/src/layout/Footer/` (not landing-only) — restyle applies site-wide; keep structure (brand / links / stats / bottom bar)
- `#exam-types` already exists on `ExamTypePage.js` root; Hero already has `handleScrollToExam`
- Assets: `images.logoW` (SVG) used in footer; also `images.logo` (png) available if light surface needs clearer mark
- `ButtonPrime` variants: `primary`, `outline`, `ghost`

**Patterns**: `classNames/bind` + SCSS modules (Hero/Process); Footer uses CSS modules + framer-motion directly (no bind today — keep existing Footer pattern)

**Constraints**: Do not delete `Evaluation/`; do not restore BackgroundDecor; no new pages outside landing+footer

---

## Numbered checklist — exact files & changes

### 1. `frontend/src/features/landing/HomePage.js`
- Remove `Evaluation` import.
- Remove `<section className="evaluation-section">…</section>` (do not render Evaluation).
- After Process section, render a new closing dual-CTA section (inline or via new component — prefer small dedicated component for clarity; see item 6).
- Keep Hero / ExamTypePage / Process order unchanged.
- **Do not** delete or rename anything under `components/Evaluation/`.

### 2. `frontend/src/features/landing/components/HeroSection/HeroSection.js`
- Shorten copy to GreenNode-style:
  - **Headline (brand-first)**: e.g. brand/`{name}` as hero signal (not buried in long welcome); keep Vietnamese.
  - **ONE supporting sentence** with keyword emphasis via `<strong>` (or equivalent) — remove multi-sentence paragraph currently in `.desc`.
- Primary CTA: keep scroll to `#exam-types` via existing `handleScrollToExam`; label either **"Khám phá ngay"** or **"Bắt đầu luyện"** (prefer **"Bắt đầu luyện"** for consistency with closing CTA).
- Reduce badge competition: remove or demote left-column badge (`Chẩn đoán nhanh năng lực`) if it competes with Quick Challenge `mock-badge`; keep QC card badge.
- Add stable anchor for secondary CTA scroll: e.g. `id="hero"` on outer `<section className={cx('hero')}>` and/or `id="quick-challenge"` on the quick carousel / image-wrapper.
- Keep Quick Challenge carousel as dominant interactive visual; no structural redesign of the card/slider.

### 3. `frontend/src/features/landing/components/HeroSection/HeroSection.module.scss`
- Adjust typography spacing for shorter copy (headline/desc hierarchy).
- If badge removed, delete unused `.badge` styles or leave harmless — prefer remove unused.
- Ensure hero grid still reads as one composition (copy left, QC right); no new cards/stat strips.

### 4. `frontend/src/layout/Footer/index.js`
- Remove `bgDecor` markup (`orbPrimary`, `orbSecondary`, `gridOverlay`) or render nothing decorative.
- Keep brand / links / stats / bottom bar structure and motion/count-up behavior.
- Switch logo to light-surface–friendly asset if needed (`images.logo` vs `logoW`) — verify contrast on white/#f8fafc.
- Keep Vietnamese labels; English comments only if added.

### 5. `frontend/src/layout/Footer/footer.module.scss`
- Replace blue gradient background with **white or `#f8fafc`**; dark text (`#0f172a` / slate).
- Add **subtle top border** (e.g. `1px solid` slate-200) to separate from page body.
- Retheme all glass/white-on-blue tokens: brand name solid dark (or subtle blue accent), links/social/email use brand blue `#0061f2` on hover/accent.
- Neutralize/remove orb + grid styles (delete rules if markup removed).
- Restyle stat cards / bottom bar for light surface (soft border, light fill — not glass-on-blue).
- Preserve responsive layout breakpoints; keep reduced-motion block updated for remaining transitions.

### 6. **NEW** `frontend/src/features/landing/components/ClosingCta/ClosingCta.js` (+ `ClosingCta.module.scss`)
- Landing-only closing section used from `HomePage` after Process.
- One composition: short Vietnamese headline/line optional or none; **two actions only**:
  - Primary `ButtonPrime`: **"Bắt đầu luyện"** → `document.getElementById('exam-types').scrollIntoView({behavior:'smooth'})`
  - Secondary `ButtonPrime variant="outline"`: **"Xem Quick Challenge"** → scroll to `#hero` or `#quick-challenge` (and optionally focus first focusable in QC)
- Patterns: `classNames/bind`, scss module, light framer-motion fade-in (match Process/Hero ease).
- No cards, no stats, no icon rows; English comments if any.
- Mount only from `HomePage.js` (not global Footer).

### 7. `frontend/src/features/landing/components/ProcessSection/ProcessSection.js` + `.module.scss` (**optional / minor only**)
- Touch only if hierarchy feels weak after Evaluation removal (e.g. slightly stronger title weight / subtitle contrast / spacing).
- Do **not** redesign steps, copy, or card structure.
- Default: **skip** if current look is already clear.

### 8. Explicitly **DO NOT** edit / delete
- `frontend/src/features/landing/components/Evaluation/**` (keep files)
- BackgroundDecor (do not restore)
- Non-landing pages, Header, ExamTypePage logic (except consuming existing `#exam-types`)
- `ModalActionFooter.js` / `FormFooter.js` (unrelated)

---

## Prerequisites
- [x] Confirm `#exam-types` on `ExamTypePage.js` (exists)
- [x] Confirm Hero scroll helper exists
- [x] Confirm `ButtonPrime` has `outline` variant
- [ ] Implementer smoke-checks landing + one inner page footer after light restyle

## Phase / order
1. HomePage: hide Evaluation  
2. Footer light restyle (JS + SCSS)  
3. Hero copy/CTA/anchor polish  
4. ClosingCta component + mount on HomePage  
5. Optional Process micro-polish  
6. Visual QA

## Risks

| Risk | Impact | Mitigation | Rollback |
|------|--------|------------|----------|
| Light footer logo contrast (`logoW` on white) | M | Switch to `images.logo` or tint wrapper | Revert footer asset + SCSS |
| Global footer change affects dark admin/marketing pages | M | Spot-check About/Policy + main app shell | Revert footer SCSS/JS only |
| Dual scroll anchors miss QC on mobile | L | Use `#hero` + optional focus; test breakpoints | Fix ids / scroll target |
| Unused Evaluation import leftovers | L | Remove import only; leave folder | N/A |

## Rollback Strategy
- Revert the listed files in git (or restore Evaluation section markup in `HomePage.js`).
- Delete `ClosingCta/` if added.
- Evaluation feature remains intact on disk regardless.

## Implementation Notes (self-contained)
- Body aesthetic target: `#f8fafc`; footer surface white/`#f8fafc` with dark text and blue accents `#0061f2`.
- Suggested hero supporting sentence pattern (VN, one line): brand + one benefit keyword emphasized — implementer may refine wording; must stay single sentence.
- Closing CTA lives on **landing only** via HomePage, not inside Footer.
- Scope hard stop: landing components + Footer layout only.
