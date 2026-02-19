# Saimos' Image Gen App

## What This Is

A personal, mobile-first image generation and editing tool wrapping Google's Gemini 3 Pro Image model. Two modes: generate images from text prompts, or transform uploaded images guided by text prompts. Features fullscreen viewing, download, clipboard copy, and a thinking quality toggle. Single-page app with distinctive sage green + cream aesthetic, zero persistence, no accounts.

## Core Value

The user can generate high-quality images from text prompts or transform uploaded images — instantly, with no friction, no signup, no clutter.

## Requirements

### Validated

- ✓ Text-to-image generation from text prompts — v1.0
- ✓ Image-to-image editing (upload reference image + text prompt) — v1.0
- ✓ Aspect ratio filter (1:1, 3:2, 2:3, 4:3, 3:4, 16:9, 9:16, 21:9) — v1.0
- ✓ Resolution filter (1K, 2K, 4K) with cost indicator — v1.0
- ✓ Fullscreen image view — v1.0
- ✓ Image download to device — v1.0
- ✓ Clipboard copy — v1.0
- ✓ Clipboard paste for image-to-image — v1.0
- ✓ Thinking level toggle (Fast/Quality) — v1.0
- ✓ Server-side API route (API key never exposed to client) — v1.0
- ✓ Input validation with clear error messages — v1.0
- ✓ Content safety filter handling (graceful 422 response) — v1.0
- ✓ Timeout handling with clear message — v1.0
- ✓ Mobile-first responsive layout (single column mobile, two-column desktop) — v1.0
- ✓ Loading states with spinner during generation — v1.0
- ✓ Soft/pastel UI aesthetic (sage green accent, cream backgrounds) — v1.0 (OKLCH design tokens)
- ✓ Distinctive typography (Playfair Display + DM Sans) — v1.0
- ✓ Vercel deployment — v1.0 (confirmed live at saimos-image-gen.vercel.app)

### Active

- [ ] Multi-turn conversational editing (iterative refinement)
- [ ] Multiple reference images (up to 14, Gemini native)
- [ ] Google Search grounding for real-time data
- [ ] Pinch-to-zoom on fullscreen view (mobile)
- [ ] Recent prompts for quick re-use
- [ ] Toast notifications for download/copy feedback (Toaster not mounted — v1.0 tech debt)

### Out of Scope

- User accounts / authentication — personal tool, single user
- Server-side storage / database — zero persistence by design
- Image history / gallery — only last generated image held in browser memory
- Batch generation — single image per request
- Streaming responses — Gemini returns complete images, nothing to stream
- Social sharing features — not a product
- PWA / offline support — API wrapper requires internet
- Cost tracking / usage dashboard — use Google AI Studio console
- Image format selection — always PNG output (lossless, universal)

## Context

Shipped v1.0 with 1,840 LOC TypeScript across 89 files.
Tech stack: Next.js 16, TypeScript, Tailwind CSS v4, @google/genai SDK.
Deployed to Vercel at saimos-image-gen.vercel.app.

- **Model:** `gemini-3-pro-image-preview` — preview model, SDK interface adapted to current API
- **SDK:** `@google/genai` (Google GenAI JS SDK) — all Gemini calls go through Next.js API route
- **Pricing:** ~$0.134 per 1K/2K image, ~$0.24 per 4K image
- **Design system:** OKLCH color space with sage green (hue 145), cream, and ink palettes — 10 lightness levels each
- **Known tech debt (7 items):** Toaster not mounted, orphaned Card/Textarea components, duplicate GenerateRequest type, semantic naming inconsistency in image-utils, INFRA-05 checkbox, missing frontmatter in 01-03-SUMMARY

## Constraints

- **Tech stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, @google/genai SDK
- **Deployment:** Vercel — deploy via git push to main
- **API key:** `GEMINI_API_KEY` must be server-side only, set in Vercel environment variables
- **Image upload:** Max 7MB, JPEG/PNG/WebP only
- **Persistence:** Zero — no localStorage, sessionStorage, IndexedDB. Component state only.
- **Single page:** Entire app is one page with contextual mode detection (upload triggers image-to-image)
- **Timeout:** Vercel serverless function timeout (60s free, 120s Pro). 4K generation gets a warning.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 16 App Router | Modern Next.js standard, PRD specifies 14+ | ✓ Good — clean Route Handler API |
| Playfair Display + DM Sans fonts | Distinctive serif+sans pair, avoids generic AI aesthetics | ✓ Good — editorial feel achieved |
| OKLCH design tokens (sage/cream/ink) | Perceptually uniform, Tailwind v4 native | ✓ Good — consistent across all components |
| npm as package manager | User preference | ✓ Good |
| Keep 4K with warning (not disable) | User plans to upgrade to Vercel Pro | ✓ Good — warning UX works |
| Blob URL for downloads (not base64) | Memory-efficient for large 4K images | ✓ Good — fetch-to-blob pattern clean |
| Zod 4 for validation | Breaking change from Zod 3 — message/error API | ✓ Good — clean validation pipeline |
| Native browser APIs (no react-dropzone) | Lighter bundle, sufficient control | ✓ Good — counter-based drag flicker solved |
| Contextual mode detection | Upload presence determines mode, no manual toggle | ✓ Good — zero-friction UX |
| Page orchestrator pattern | All state in page.tsx, children are pure props/callbacks | ✓ Good — clean data flow |
| Native HTML dialog for fullscreen | Built-in Escape, focus trap, backdrop | ✓ Good — accessible by default |
| react-textarea-autosize | Safari compatibility (CSS field-sizing not supported) | ✓ Good |
| AbortController ref (not useEffect) | User-triggered generation cancellation | ✓ Good |
| Default thinking level HIGH | Best quality out of the box | ⚠️ Revisit — may increase latency for casual use |
| Thinking fallback retry | Remove thinkingConfig if API rejects | ✓ Good — graceful degradation |
| CSS Grid with sticky output | minmax(320px,2fr) 3fr, sticky md:top-8 | ✓ Good — image visible while scrolling |

---
*Last updated: 2026-02-18 after v1.0 milestone*
