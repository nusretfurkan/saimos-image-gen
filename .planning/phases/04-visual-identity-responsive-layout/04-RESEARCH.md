# Phase 4: Visual Identity + Responsive Layout - Research

**Researched:** 2026-02-18
**Domain:** CSS design system (Tailwind CSS v4 theming, Google Fonts, responsive layout)
**Confidence:** HIGH

## Summary

Phase 4 is a pure styling and layout phase -- no new features, no new components, no new API work. The existing functional components from Phases 1-2 get a distinctive visual identity (sage green + cream palette, Playfair Display + DM Sans typography) and a responsive layout (single-column mobile at < 768px, two-column desktop at >= 768px). All implementation happens through Tailwind CSS v4's `@theme` directive for design tokens and `next/font/google` for optimized font loading.

The technical approach is straightforward: define a custom color palette and typography in `globals.css` using `@theme`, load Google Fonts via `next/font/google` with CSS variable output, wire them together using `@theme inline`, then apply the design system to existing components with Tailwind utility classes. The responsive layout uses Tailwind's built-in `md:` breakpoint (48rem = 768px) for the mobile-to-desktop transition, with CSS Grid or Flexbox for the two-column desktop arrangement. No additional libraries are needed.

The main risk is not technical but aesthetic: the frontend-design skill emphasizes that the result must be "distinctive and non-generic" -- it must not look like a default AI tool template. The research recommends an "editorial organic" aesthetic direction: warm cream surfaces with subtle texture (CSS noise/grain overlay), generous whitespace, deliberate asymmetry in spacing, sage green used sparingly as an accent (not flooding the UI), and Playfair Display used only for key headings to create contrast against DM Sans body text. The generated image must remain the hero -- the visual system supports it, never competes with it.

**Primary recommendation:** Define all design tokens (colors, typography, shadows, radii, animations) in a single `@theme` block in `globals.css`, load Playfair Display and DM Sans via `next/font/google` with `variable` option, connect them to Tailwind via `@theme inline`, then style components with utility classes. Use the `md:` breakpoint (768px) for the two-column layout transition.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

No locked decisions -- all visual decisions delegated to Claude's discretion, anchored by the PRD's direction.

### Claude's Discretion

The user delegated all visual decisions to Claude, anchored by the PRD's direction. Claude has full flexibility on:

**Color palette:**
- Exact sage green shade(s) and how many levels (primary, hover, muted, border, etc.)
- Cream background warmth and variation (page vs card vs surface)
- Dark text color choice and secondary text colors
- Any accent or semantic colors needed (error red, success green, etc.)

**Visual personality:**
- How to make it look distinctive and non-generic -- mood, texture, spacing rhythm
- Whether to use any decorative elements (gradients, grain, subtle patterns)
- The overall feel: editorial, organic, studio, or other direction
- How "soft" vs "crisp" the aesthetic lands

**Component styling:**
- Border radius sizes (uniform or varied by component)
- Shadow depth and spread
- Button treatment (filled, outline, gradient, or mixed)
- Input field styling (bordered, underlined, filled background)
- Transition timing and easing curves
- Focus ring styling
- Hover/active state treatments

**Desktop layout proportions:**
- Column split ratio (e.g., 40/60 vs 35/65)
- Controls column max-width
- How the generated image fills its space
- Spacing between columns
- Any max-width container for ultra-wide screens

**PRD constraints that apply (non-negotiable):**
- Sage green accent color for interactive elements (buttons, active states, focus rings)
- Cream as background tint / surface color
- Dark text on light backgrounds
- Playfair Display for headings, DM Sans for body text
- Minimalist -- generous whitespace, no visual clutter
- Generated image is the hero -- everything else secondary
- Subtle shadows, rounded corners, soft transitions
- No heavy borders or harsh contrasts
- Mobile-first: single column at < 768px
- Desktop: two columns (controls left, output right) at >= 768px

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIS-01 | Soft/pastel aesthetic with sage green accent and cream backgrounds | Sage green palette defined with 6 levels (50-900) using OKLCH; cream palette with 3 surface levels; custom shadows with warm tones. See "Color Palette Design" and "Code Examples" sections. |
| VIS-02 | Playfair Display (headings) + DM Sans (body) typography | Both are variable fonts on Google Fonts; loaded via `next/font/google` with `variable` option; wired to Tailwind via `@theme inline`. See "Typography Setup" section. |
| VIS-03 | Distinctive, non-generic design (per frontend-design skill guidelines) | "Editorial organic" direction: warm surfaces, subtle grain texture, asymmetric spacing, restrained accent color use, Playfair Display for key headings only, generous whitespace. See "Visual Identity Direction" section. |
| UX-02 | Mobile layout is usable and well-proportioned on common phone screen sizes | Single-column layout with full-width components, touch-friendly sizing (44px min tap targets), stacked vertical flow. See "Mobile Layout Pattern" section. |
| UX-03 | Desktop layout uses two-column arrangement (controls left, output right) | CSS Grid or Flexbox with `md:` breakpoint (768px); 40/60 column split; controls max-width ~480px; image fills remaining space. See "Desktop Layout Pattern" section. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.1.x | Design token system + utility classes | Already in project stack. `@theme` directive replaces config files. All design tokens (colors, fonts, shadows, radii, animations) defined in CSS. |
| next/font/google | (bundled with Next.js 16) | Font loading and optimization | Self-hosts Google Fonts at build time. Zero layout shift. No external requests to Google. CSS variable output integrates with Tailwind v4. |

### Supporting

No additional libraries needed. Everything is achievable with Tailwind CSS v4 utilities and native CSS.

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | Phase 4 requires no new dependencies |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind `@theme` for design tokens | CSS Modules or styled-components | Tailwind is already in the stack. Adding a parallel styling system creates inconsistency. No benefit. |
| `next/font/google` for fonts | `@import url(...)` in CSS | `next/font` self-hosts fonts, eliminates render-blocking requests, prevents layout shift. Raw `@import` causes flash of unstyled text and sends requests to Google. |
| CSS noise/grain overlay | SVG texture library | A 3-line CSS filter (`url(#noise)` with inline SVG or `background-image` with data URI) is lighter than any library. |
| Tailwind built-in animations | tailwindcss-animate | `tailwindcss-animate` is deprecated by shadcn/ui (March 2025). Tailwind v4 has native `--animate-*` support in `@theme`. |

**Installation:**
```bash
# No new packages needed for Phase 4
# Tailwind CSS and next/font are already in the project from Phase 1 scaffold
```

## Architecture Patterns

### Recommended File Structure (Phase 4 Changes)

```
src/
├── app/
│   ├── layout.tsx          # ADD: Font imports (Playfair Display, DM Sans), CSS variable classes on <html>
│   ├── page.tsx            # MODIFY: Add responsive layout classes (grid, md: breakpoint)
│   └── globals.css         # MODIFY: Add @theme design tokens, @theme inline font mapping
├── components/
│   ├── prompt-input.tsx    # MODIFY: Apply design system classes
│   ├── image-upload.tsx    # MODIFY: Apply design system classes
│   ├── result-display.tsx  # MODIFY: Apply design system classes
│   ├── mode-selector.tsx   # MODIFY: Apply design system classes
│   └── ui/                 # MODIFY: Apply design system to primitives
│       ├── button.tsx
│       ├── card.tsx
│       └── textarea.tsx
```

**Key insight:** Phase 4 modifies existing files only. No new files are created (except possibly a fonts.ts definitions file for organization). All changes are CSS class additions and `globals.css` theme configuration.

### Pattern 1: Design Tokens via @theme

**What:** Define all visual design tokens (colors, typography, shadows, radii, transitions, animations) in a single `@theme` block in `globals.css`. This creates both CSS custom properties AND Tailwind utility classes automatically.
**When to use:** Always, for any design value that components reference.

**Example:**
```css
/* app/globals.css */
@import "tailwindcss";

/* Wire next/font CSS variables to Tailwind font utilities */
@theme inline {
  --font-heading: var(--font-playfair-display);
  --font-body: var(--font-dm-sans);
}

@theme {
  /* Sage green palette */
  --color-sage-50: oklch(0.97 0.02 145);
  --color-sage-100: oklch(0.93 0.04 145);
  --color-sage-200: oklch(0.87 0.06 145);
  --color-sage-300: oklch(0.78 0.08 145);
  --color-sage-400: oklch(0.68 0.09 145);
  --color-sage-500: oklch(0.60 0.10 145);
  --color-sage-600: oklch(0.52 0.09 145);
  --color-sage-700: oklch(0.44 0.08 145);
  --color-sage-800: oklch(0.36 0.06 145);
  --color-sage-900: oklch(0.28 0.04 145);

  /* Cream palette */
  --color-cream-50: oklch(0.99 0.01 90);
  --color-cream-100: oklch(0.97 0.02 85);
  --color-cream-200: oklch(0.94 0.03 80);

  /* Dark text */
  --color-ink-900: oklch(0.20 0.02 260);
  --color-ink-700: oklch(0.35 0.02 260);
  --color-ink-500: oklch(0.50 0.02 260);

  /* Semantic colors */
  --color-error: oklch(0.65 0.20 25);
  --color-success: oklch(0.70 0.15 145);

  /* Custom shadows (warm-tinted, soft) */
  --shadow-card: 0 1px 3px 0 oklch(0.28 0.04 145 / 0.06), 0 1px 2px -1px oklch(0.28 0.04 145 / 0.04);
  --shadow-elevated: 0 4px 12px -2px oklch(0.28 0.04 145 / 0.08), 0 2px 4px -2px oklch(0.28 0.04 145 / 0.04);

  /* Border radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.25rem;

  /* Custom transitions */
  --ease-soft: cubic-bezier(0.25, 0.1, 0.25, 1.0);

  /* Custom animations */
  --animate-fade-in: fade-in 0.3s var(--ease-soft);
  --animate-slide-up: slide-up 0.4s var(--ease-soft);

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slide-up {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
}
```

### Pattern 2: Font Loading with CSS Variable Bridge

**What:** Load Google Fonts via `next/font/google` with the `variable` option, which injects CSS custom properties (e.g., `--font-playfair-display`) into the DOM. Then bridge those variables to Tailwind's font system using `@theme inline` in `globals.css`.
**When to use:** Always when combining `next/font` with Tailwind CSS v4.

**Example:**
```typescript
// app/layout.tsx
import { Playfair_Display, DM_Sans } from 'next/font/google';

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair-display',
  // Variable font: weight range 400-900, no need to specify individual weights
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
  // Variable font: weight range 100-900, no need to specify individual weights
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${dmSans.variable} antialiased`}
    >
      <body className="font-body bg-cream-50 text-ink-900">
        {children}
      </body>
    </html>
  );
}
```

**Critical detail:** Use `@theme inline` (not `@theme`) when referencing `var(--font-*)` from `next/font`. The `inline` keyword tells Tailwind to treat the variable reference as a runtime value rather than trying to resolve it at build time. Without `inline`, the font variables are empty at Tailwind compile time and the utility classes generate broken CSS.

```css
/* globals.css -- CORRECT */
@theme inline {
  --font-heading: var(--font-playfair-display);
  --font-body: var(--font-dm-sans);
}

/* globals.css -- WRONG (will not work) */
@theme {
  --font-heading: var(--font-playfair-display);  /* Empty at build time! */
}
```

### Pattern 3: Responsive Two-Column Layout

**What:** Mobile-first single column that transitions to a two-column grid at the `md:` breakpoint (768px).
**When to use:** The page-level layout in `page.tsx`.

**Example:**
```tsx
// app/page.tsx (layout structure)
<main className="min-h-screen bg-cream-50">
  <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
    {/* Header */}
    <header className="mb-8">
      <h1 className="font-heading text-2xl font-semibold text-ink-900 md:text-3xl">
        Saimos' Image Gen
      </h1>
    </header>

    {/* Two-column layout: stacked on mobile, side-by-side on desktop */}
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(320px,2fr)_3fr] md:gap-12">
      {/* Controls column (left on desktop) */}
      <div className="space-y-6 md:max-w-lg">
        <ModeSelector />
        <PromptInput />
        <FilterControls />
        <GenerateButton />
      </div>

      {/* Output column (right on desktop, below on mobile) */}
      <div className="md:sticky md:top-8 md:self-start">
        <ResultDisplay />
      </div>
    </div>
  </div>
</main>
```

**Grid rationale:** `md:grid-cols-[minmax(320px,2fr)_3fr]` creates a roughly 40/60 split where the controls column has a minimum width of 320px (preventing compression on narrow desktop screens) and the image output gets the remaining space. The `md:sticky md:top-8` on the output column keeps the image visible while scrolling the controls on desktop.

### Anti-Patterns to Avoid

- **Flooding the UI with sage green:** Sage green is an *accent* color for interactive elements (buttons, focus rings, active states), not a background or surface color. Using it for large surfaces makes the UI look like a "green theme" template. Use cream for surfaces and sage green for small, intentional touches.
- **Using Playfair Display for all text:** Playfair is a display typeface -- high contrast, decorative serifs. It is designed for headlines, not body text. At small sizes (< 16px) it becomes hard to read. Use it only for the app title, section headings, and key labels. DM Sans handles everything else.
- **Applying the same border-radius to everything:** Uniform rounding looks generic. Use varied radii: small for buttons and inputs (0.5rem), medium for cards (0.75rem), large for the image display area (1rem). This creates visual hierarchy.
- **Ignoring the `prefers-reduced-motion` media query:** Animations and transitions must respect `motion-safe:` / `motion-reduce:` variants in Tailwind. Users with vestibular disorders will have `prefers-reduced-motion: reduce` set.
- **Hardcoding pixel breakpoints instead of using Tailwind's `md:` prefix:** Tailwind's `md:` maps to `@media (width >= 48rem)` which is 768px. Do not add a custom breakpoint unless the default is wrong.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font loading and optimization | Manual `@font-face` declarations, Google Fonts `<link>` tags | `next/font/google` with `variable` option | Handles self-hosting, preloading, `font-display: swap`, fallback metrics for zero CLS. Manual setup misses all of these. |
| Design token system | Custom CSS variables scattered across files | Tailwind `@theme` block in `globals.css` | Single source of truth. Generates utility classes automatically. Theme values accessible as CSS variables everywhere. |
| Responsive breakpoint logic | Custom `window.matchMedia` listeners in JavaScript | Tailwind `md:` prefix in utility classes | CSS media queries are more performant (no JS execution), more reliable (no hydration mismatch), and simpler to maintain. |
| Color opacity variants | Manual `rgba()` calculations | Tailwind opacity modifier (`bg-sage-500/50`) | Tailwind v4 handles opacity modifiers natively with any color format including OKLCH. |
| Grain/noise texture | Canvas-based procedural generation | CSS `background-image` with SVG data URI or CSS `filter: url(#noise)` | A ~200-byte inline SVG or CSS filter creates the same organic feel without JavaScript. |

**Key insight:** Phase 4 is 100% CSS work. Every pattern needed is covered by Tailwind v4 utilities and `@theme` configuration. There is no JavaScript logic to write. The only TypeScript changes are adding `className` props to existing components and updating the layout.tsx font imports.

## Common Pitfalls

### Pitfall 1: @theme vs @theme inline for next/font Variables

**What goes wrong:** Font utility classes (`font-heading`, `font-body`) generate empty `font-family` values. Text renders in the browser's default serif/sans-serif instead of Playfair Display or DM Sans.
**Why it happens:** `next/font/google` injects CSS variables at runtime (they are added to the DOM via the `className` on `<html>`). Tailwind's `@theme` block is processed at build time. At build time, `var(--font-playfair-display)` resolves to nothing because the variable does not exist yet.
**How to avoid:** Use `@theme inline` for any theme value that references a runtime CSS variable. This tells Tailwind to output the `var()` reference literally instead of trying to resolve it.
**Warning signs:** Fonts look wrong in production but the CSS variable is visible in DevTools on the `<html>` element.

### Pitfall 2: OKLCH Browser Support

**What goes wrong:** Colors appear as fallback values or transparent on older browsers that do not support OKLCH.
**Why it happens:** OKLCH color space is supported in Chrome 111+, Firefox 113+, Safari 15.4+. Older browsers ignore `oklch(...)` values entirely.
**How to avoid:** For this project (personal tool, modern browsers), OKLCH is safe. However, add a `@supports` fallback in `globals.css` for the page background color as a safety net: `html { background-color: #FDFAF5; }` before the Tailwind import.
**Warning signs:** Page appears white (no cream background) on an older device.

### Pitfall 3: Layout Shift from Font Loading

**What goes wrong:** Text jumps or reflowed when custom fonts load, causing visible layout shift (CLS).
**Why it happens:** If `font-display: swap` is used without `adjustFontFallback`, the fallback font has different metrics (character widths, line heights) than the loaded font, causing text to reflow.
**How to avoid:** `next/font/google` handles this automatically -- it generates a size-adjusted fallback font that matches the metrics of the loaded font. Keep `adjustFontFallback: true` (the default). Use `display: 'swap'` for both fonts.
**Warning signs:** Text visibly jumps on first page load, especially on slow connections.

### Pitfall 4: Two-Column Layout Breaking on Tablet

**What goes wrong:** The two-column layout activates at 768px (iPad in portrait mode), but the controls column is too narrow to be usable, especially for filter pill buttons and the textarea.
**Why it happens:** 768px is just barely wide enough for two columns. If the controls column has no minimum width, it can squeeze down to ~300px.
**How to avoid:** Use `md:grid-cols-[minmax(320px,2fr)_3fr]` to enforce a minimum width on the controls column. If the viewport is too narrow for both columns at their minimum widths, CSS Grid will automatically collapse to single column.
**Warning signs:** Filter buttons wrap to multiple rows on iPad portrait. Textarea feels cramped.

### Pitfall 5: Sage Green Color Contrast (Accessibility)

**What goes wrong:** White text on sage green backgrounds fails WCAG 2.1 AA contrast ratio (4.5:1 for normal text).
**Why it happens:** Sage green is inherently a mid-tone color. The typical sage green (`~oklch(0.60 0.10 145)`) has insufficient contrast against white text.
**How to avoid:** Use sage-700 or darker (`oklch(0.44 0.08 145)` or darker) for text-on-white. For white-on-sage buttons, use sage-600 or darker as the background. Verify contrast with a tool like WebAIM's contrast checker. Alternatively, use dark text (ink-900) on sage backgrounds for all cases.
**Warning signs:** Buttons look washed out, text is hard to read in bright lighting or on mobile screens.

### Pitfall 6: Over-Designing -- Competing with the Generated Image

**What goes wrong:** The UI itself becomes visually loud, drawing attention away from the generated image which should be the hero element.
**Why it happens:** Adding too many decorative elements (gradients, patterns, colored borders, multiple accent colors) in an attempt to make the design "distinctive."
**How to avoid:** The generated image IS the visual interest. The UI should be quiet, warm, and elegant. Distinctive comes from restraint and intentionality: the Playfair Display serif heading, the warm cream tones, the precise spacing rhythm. NOT from adding more visual elements.
**Warning signs:** The controls panel feels more visually interesting than the generated image.

## Code Examples

Verified patterns from official sources:

### Complete globals.css Design System

```css
/* Source: Tailwind CSS v4 official docs -- https://tailwindcss.com/docs/theme */

@import "tailwindcss";

/* Safety net for older browsers */
html { background-color: #FDFAF5; }

/* Bridge next/font CSS variables to Tailwind font utilities */
@theme inline {
  --font-heading: var(--font-playfair-display);
  --font-body: var(--font-dm-sans);
}

@theme {
  /* === SAGE GREEN PALETTE === */
  /* Primary accent for interactive elements */
  --color-sage-50: oklch(0.97 0.02 145);   /* Lightest tint (hover bg, subtle highlights) */
  --color-sage-100: oklch(0.93 0.04 145);  /* Light tint (selected state bg) */
  --color-sage-200: oklch(0.87 0.06 145);  /* Border color, divider */
  --color-sage-300: oklch(0.78 0.08 145);  /* Disabled state */
  --color-sage-400: oklch(0.68 0.09 145);  /* Placeholder, muted accent */
  --color-sage-500: oklch(0.60 0.10 145);  /* Primary accent -- buttons, focus rings */
  --color-sage-600: oklch(0.52 0.09 145);  /* Hover state for primary accent */
  --color-sage-700: oklch(0.44 0.08 145);  /* Active/pressed state */
  --color-sage-800: oklch(0.36 0.06 145);  /* Text on light bg (high contrast) */
  --color-sage-900: oklch(0.28 0.04 145);  /* Darkest sage (rare use) */

  /* === CREAM PALETTE === */
  /* Warm backgrounds and surfaces */
  --color-cream-50: oklch(0.99 0.01 90);   /* Page background */
  --color-cream-100: oklch(0.97 0.02 85);  /* Card/surface background */
  --color-cream-200: oklch(0.94 0.03 80);  /* Elevated surface, input backgrounds */

  /* === INK PALETTE === */
  /* Text colors -- warm dark tones, not pure black */
  --color-ink-900: oklch(0.20 0.02 260);   /* Primary text */
  --color-ink-700: oklch(0.35 0.02 260);   /* Secondary text */
  --color-ink-500: oklch(0.50 0.02 260);   /* Tertiary text, placeholders */
  --color-ink-300: oklch(0.70 0.01 260);   /* Disabled text */

  /* === SEMANTIC COLORS === */
  --color-error: oklch(0.65 0.20 25);      /* Error messages */
  --color-error-bg: oklch(0.95 0.03 25);   /* Error background tint */
  --color-success: oklch(0.70 0.15 145);   /* Success states */

  /* === SHADOWS === */
  /* Warm-tinted shadows (sage-tinted, not pure black) */
  --shadow-card: 0 1px 3px 0 oklch(0.28 0.04 145 / 0.06),
                 0 1px 2px -1px oklch(0.28 0.04 145 / 0.04);
  --shadow-elevated: 0 4px 12px -2px oklch(0.28 0.04 145 / 0.08),
                     0 2px 4px -2px oklch(0.28 0.04 145 / 0.04);
  --shadow-focus: 0 0 0 3px oklch(0.60 0.10 145 / 0.25);

  /* === BORDER RADIUS === */
  --radius-sm: 0.375rem;   /* 6px - small elements: tags, badges */
  --radius-md: 0.5rem;     /* 8px - buttons, inputs */
  --radius-lg: 0.75rem;    /* 12px - cards, panels */
  --radius-xl: 1rem;       /* 16px - image display, modals */
  --radius-2xl: 1.25rem;   /* 20px - large containers */

  /* === TRANSITIONS === */
  --ease-soft: cubic-bezier(0.25, 0.1, 0.25, 1.0);  /* Smooth deceleration */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Slight overshoot */

  /* === ANIMATIONS === */
  --animate-fade-in: fade-in 0.3s var(--ease-soft);
  --animate-slide-up: slide-up 0.4s var(--ease-soft);
  --animate-scale-in: scale-in 0.2s var(--ease-spring);

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slide-up {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes scale-in {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }
}
```

### Complete layout.tsx Font Setup

```typescript
// Source: Next.js 16 official docs -- https://nextjs.org/docs/app/api-reference/components/font

import { Playfair_Display, DM_Sans } from 'next/font/google';

// Both are variable fonts -- no need to specify individual weights
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair-display',
  // Variable font axes: weight (400-900), italic (0-1)
  // All weights available automatically
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
  // Variable font axes: weight (100-900), italic, optical size
  // All weights available automatically
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${dmSans.variable} antialiased`}
    >
      <body className="font-body bg-cream-50 text-ink-900 leading-relaxed">
        {children}
      </body>
    </html>
  );
}
```

### Responsive Two-Column Layout

```tsx
// Source: Tailwind CSS v4 responsive docs -- https://tailwindcss.com/docs/responsive-design
// md: breakpoint = 48rem (768px) -- matches requirement

<main className="min-h-screen bg-cream-50">
  <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
    {/* Header */}
    <header className="mb-8 md:mb-12">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink-900 md:text-3xl">
        Saimos' Image Gen
      </h1>
    </header>

    {/* Mobile: stacked, Desktop: two-column grid */}
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(320px,2fr)_3fr] md:gap-12 lg:gap-16">
      {/* Controls panel (left column on desktop) */}
      <aside className="space-y-6 md:max-w-lg">
        {/* Mode selector, prompt input, filters, generate button */}
      </aside>

      {/* Output panel (right column on desktop) */}
      <section className="md:sticky md:top-8 md:self-start">
        {/* Generated image display */}
      </section>
    </div>
  </div>
</main>
```

### Button Component Styling

```tsx
// Sage green button with hover/active/focus states
<button
  className={cn(
    // Base
    "inline-flex items-center justify-center gap-2",
    "rounded-md px-5 py-2.5",
    "font-body text-sm font-medium",
    "transition-all duration-200 ease-soft",
    // Color: filled sage green with white text
    "bg-sage-500 text-white",
    // Hover: darker
    "hover:bg-sage-600",
    // Active: even darker, slight scale
    "active:bg-sage-700 active:scale-[0.98]",
    // Focus: sage-tinted ring
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50",
    // Disabled
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sage-500",
    // Reduced motion
    "motion-reduce:transition-none",
  )}
>
  Generate
</button>
```

### Card/Surface Component Styling

```tsx
// Warm card with subtle shadow
<div
  className={cn(
    "rounded-lg bg-cream-100 p-6",
    "shadow-card",
    "border border-sage-200/40",
    "transition-shadow duration-200 ease-soft",
    "hover:shadow-elevated",
  )}
>
  {/* Card content */}
</div>
```

### Input Field Styling

```tsx
// Text input with cream background and sage focus ring
<textarea
  className={cn(
    // Base
    "w-full rounded-md px-4 py-3",
    "font-body text-base text-ink-900 placeholder:text-ink-500",
    "bg-cream-200",
    // Border
    "border border-sage-200/50",
    // Focus
    "focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-500/20",
    // Transition
    "transition-all duration-200 ease-soft",
    // Resize
    "resize-none",
    // Reduced motion
    "motion-reduce:transition-none",
  )}
  placeholder="Describe the image you want to create..."
  rows={4}
/>
```

### Subtle Grain Texture Overlay (CSS Only)

```css
/* Add to globals.css -- creates organic, non-generic feel */
/* Source: CSS noise technique using SVG filter */
@layer base {
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 256px 256px;
  }
}
```

## Visual Identity Direction

### Recommended Aesthetic: "Editorial Organic"

Based on the frontend-design skill's guidance and the PRD's "soft/pastel" direction, the recommended aesthetic is **editorial organic** -- a warm, intentional design that feels like a curated studio tool rather than a generic SaaS dashboard.

**Core principles:**
1. **Warm, not cool:** Cream backgrounds (not white/gray), warm-tinted shadows (not pure black), sage green accents (not blue/purple). Every surface has warmth.
2. **Restrained accent color:** Sage green is used for interactive elements only (buttons, focus rings, active states, links). It appears in small, intentional touches. Never as a background fill or large surface.
3. **Typographic contrast:** Playfair Display (serif, high contrast, decorative) for the app title and section headings. DM Sans (sans-serif, clean, geometric) for everything else. The contrast between the two creates visual personality.
4. **Generous whitespace:** The PRD says "minimalist -- generous whitespace." This means the spacing between elements is the design. Let the cream background breathe. Do not fill every gap.
5. **Subtle texture:** A barely-visible grain/noise overlay (opacity: 0.03) on the page background adds organic warmth and prevents the "flat digital" feel. This is what separates a designed app from a template.
6. **Image as hero:** The generated image display area should be the largest, most prominent element. On desktop, it occupies ~60% of the viewport width. It has a subtle border radius and minimal chrome (no heavy frame, no distracting controls around it).
7. **Soft depth:** Shadows are warm-tinted (sage-900 at low opacity) and subtle. Cards have just enough elevation to separate from the background. No harsh drop shadows.

**What makes it non-generic:**
- The Playfair Display serif in a generation tool is unexpected -- most AI tools use sans-serif exclusively
- Warm cream backgrounds instead of the ubiquitous white/gray
- Sage green instead of the standard blue/purple AI tool palette
- The subtle grain texture adds physical warmth
- Deliberate asymmetry in spacing (e.g., more padding above the image than below, tighter spacing in the controls panel)
- The overall impression should be "elegant personal tool" not "startup SaaS product"

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` for theme | `@theme` directive in CSS | Tailwind v4 (Jan 2025) | No more JS config file. All design tokens live in CSS. Simpler, faster. |
| `tailwindcss-animate` for animations | Native `--animate-*` in `@theme` | shadcn/ui deprecation (Mar 2025) | One fewer dependency. Animations defined alongside other tokens. |
| Hex/RGB colors | OKLCH color space | Tailwind v4 default | Perceptually uniform. Better gradients, more predictable opacity. |
| `@import url('fonts.googleapis.com/...')` | `next/font/google` | Next.js 13+ (2023) | Self-hosted, no external requests, zero CLS, automatic fallback metrics. |
| `tailwind.config.js` font family | `@theme inline { --font-*: var(...) }` | Tailwind v4 (Jan 2025) | CSS-native font variable bridging. No JS config. |

**Deprecated/outdated:**
- `tailwindcss-animate`: Replaced by Tailwind v4 native `--animate-*` in `@theme`
- `tailwind.config.js` / `tailwind.config.ts`: Replaced by `@theme` in CSS for all customization
- Google Fonts `<link>` tags or `@import url(...)`: Replaced by `next/font/google` for performance and privacy

## Open Questions

1. **Exact OKLCH sage green hue angle**
   - What we know: Sage green sits around hue 145 in OKLCH. The exact appearance depends on chroma and lightness values.
   - What's unclear: The recommended values above are based on color theory, not visual testing. The exact shades need to be tuned in the browser.
   - Recommendation: Start with the proposed palette, then visually adjust in the browser using Chrome DevTools' OKLCH color picker. The hue angle (145) and chroma (0.02-0.10 range) may need tweaking to feel right on screen. Prioritize the 500 level (primary accent) and 50 level (lightest tint) first.

2. **Grain texture performance on mobile**
   - What we know: A CSS `background-image` with SVG noise at low opacity is lightweight. The SVG is tiny (~200 bytes as a data URI).
   - What's unclear: Rendering a fixed-position pseudo-element with a repeating SVG background on every frame could affect scroll performance on low-end mobile devices.
   - Recommendation: Implement it, then test on a real phone. If scroll jank is detected, remove the fixed positioning and apply the texture only to the `<body>` background (static, not fixed). If that still jitters, remove it entirely -- it is a nice-to-have, not a requirement.

3. **Sticky image panel behavior on desktop**
   - What we know: `position: sticky` keeps the image visible while scrolling controls. This is a common pattern.
   - What's unclear: If the generated image is taller than the viewport (e.g., 9:16 aspect ratio at high resolution), sticky positioning will clip the bottom of the image.
   - Recommendation: Use `md:sticky md:top-8 md:self-start` with `max-height: calc(100vh - 4rem)` and `overflow-y: auto` on the image container. This ensures the image is always fully viewable.

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4 @theme documentation](https://tailwindcss.com/docs/theme) -- Design token system, all namespaces, @theme vs @theme inline, OKLCH color syntax
- [Tailwind CSS v4 colors documentation](https://tailwindcss.com/docs/colors) -- Custom color palettes, opacity modifiers, --alpha() function
- [Tailwind CSS v4 responsive design documentation](https://tailwindcss.com/docs/responsive-design) -- Breakpoints, md: prefix (768px), mobile-first utilities, custom breakpoints
- [Tailwind CSS v4 box-shadow documentation](https://tailwindcss.com/docs/box-shadow) -- Custom shadows via @theme, shadow-color utilities
- [Tailwind CSS v4 animation documentation](https://tailwindcss.com/docs/animation) -- Custom animations via @theme with @keyframes
- [Tailwind CSS v4 transition-timing-function documentation](https://tailwindcss.com/docs/transition-timing-function) -- Custom easing curves via @theme
- [Next.js 16 Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) -- next/font/google usage, self-hosting, CSS variable output
- [Next.js 16 Font API Reference](https://nextjs.org/docs/app/api-reference/components/font) -- variable option, display option, multiple fonts, Tailwind CSS v4 integration with @theme inline
- [Playfair Display on Google Fonts](https://fonts.google.com/specimen/Playfair+Display) -- Variable font (400-900 weight range, italic axis)
- [DM Sans on Google Fonts](https://fonts.google.com/specimen/DM+Sans) -- Variable font (100-900 weight range, italic axis, optical size axis)

### Secondary (MEDIUM confidence)
- [Tailwind CSS v4 + next/font discussion (GitHub #15267)](https://github.com/tailwindlabs/tailwindcss/discussions/15267) -- Confirms @theme inline is required for next/font variables
- [Build with Matija: Google Fonts in Next.js 15 + Tailwind v4](https://www.buildwithmatija.com/blog/how-to-use-custom-google-fonts-in-next-js-15-and-tailwind-v4) -- Practical integration guide
- [Figma: Sage Color](https://www.figma.com/colors/sage/) -- Sage green hex values and design context
- [Figma: Cream Color](https://www.figma.com/colors/cream/) -- Cream color values and warm neutral pairing guidance
- [Frontend-design skill](.skills/frontend-design/SKILL.md) -- Design guidelines for distinctive, non-generic interfaces

### Tertiary (LOW confidence)
- [fffuel.co nnnoise SVG generator](https://www.fffuel.co/nnnoise/) -- SVG noise texture technique (community tool, not official docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Tailwind CSS v4 and next/font are already in the project stack from Phase 1. All capabilities verified against official documentation.
- Architecture: HIGH -- The pattern is well-documented: `@theme` for tokens, `@theme inline` for font variable bridging, `md:` for responsive layout. No novel patterns.
- Pitfalls: HIGH -- All 6 pitfalls sourced from official docs or verified community reports. The @theme inline gotcha is the most critical and is confirmed by multiple sources.

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable domain, low churn)
