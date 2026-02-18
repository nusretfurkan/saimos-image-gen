# Saimos' Image Gen App

## What This Is

A personal, mobile-first image generation and editing tool wrapping Google's Gemini 3 Pro Image model (`gemini-3-pro-image-preview`). Two modes: generate images from text prompts, or transform/edit uploaded images guided by text prompts. Single-page app, zero persistence, no accounts — a clean pipe between the user and the model.

## Core Value

The user can generate high-quality images from text prompts or transform uploaded images — instantly, with no friction, no signup, no clutter.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Text-to-image generation from text prompts
- [ ] Image-to-image editing (upload reference image + text prompt)
- [ ] Aspect ratio filter (1:1, 3:2, 2:3, 4:3, 3:4, 16:9, 9:16, 21:9)
- [ ] Resolution filter (1K, 2K, 4K) with cost indicator
- [ ] Fullscreen image view
- [ ] Image download to device
- [ ] Server-side API route (API key never exposed to client)
- [ ] Input validation with clear error messages
- [ ] Content safety filter handling (graceful 422 response)
- [ ] Mobile-first responsive layout (single column mobile, two-column desktop)
- [ ] Loading states with spinner during generation
- [ ] Soft/pastel UI aesthetic (light green accent, cream backgrounds)
- [ ] Distinctive typography (Playfair Display + DM Sans)
- [ ] Vercel deployment

### Out of Scope

- User accounts / authentication — personal tool, single user
- Server-side storage / database — zero persistence by design
- Image history / gallery — only last generated image held in browser memory
- Batch generation — single image per request
- Streaming responses — wait for full response
- Prompt history / saved presets — v2 consideration
- Social sharing features — not a product
- Advanced editing (masking, inpainting, region selection) — v2+
- Multiple reference images — Gemini supports up to 14, overkill for v1
- PWA / offline support — web-only is fine
- Cost tracking / usage dashboard — casual personal use

## Context

- **Model:** `gemini-3-pro-image-preview` is a preview model — SDK interface may differ from documentation. Implementation should adapt to current SDK API.
- **SDK:** `@google/genai` (Google GenAI JS SDK) — all Gemini calls go through Next.js API route
- **Pricing:** ~$0.134 per 1K/2K image, ~$0.24 per 4K image. Estimated <$5/month at casual use.
- **SynthID:** All generated images carry Google's invisible SynthID watermark — acceptable
- **Vercel Free tier:** Currently on free tier (60s serverless function timeout). 4K generation may need Pro tier (120s timeout). Keep 4K option with warning. Planning to upgrade.
- **Body size:** Base64-encoded images up to 7MB need 12MB body parser limit. App Router requires `experimental.serverActions.bodySizeLimit` instead of Pages Router `bodyParser.sizeLimit`.
- **Design skill:** Frontend-design skill active — guides toward distinctive, non-generic UI output

## Constraints

- **Tech stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, @google/genai SDK — specified in PRD
- **Deployment:** Vercel — deploy via git push to main
- **API key:** `GEMINI_API_KEY` must be server-side only, set in Vercel environment variables
- **Image upload:** Max 7MB, JPEG/PNG/WebP only
- **Persistence:** Zero — no localStorage, sessionStorage, IndexedDB. Component state only.
- **Single page:** Entire app is one page with two input modes (tabs/toggle)
- **Timeout:** Vercel Free = 60s, Pro = 120s. 4K generation gets a warning on free tier.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router (not Pages Router) | Modern Next.js standard, PRD specifies 14+ | — Pending |
| Playfair Display + DM Sans fonts | Distinctive serif+sans pair per frontend-design skill, avoids generic AI aesthetics | — Pending |
| Sage green (#8BAF7C) + cream (#FAF8F0) palette | Soft/pastel direction from PRD, refined to specific values | — Pending |
| GSD for project management | Spec-driven development, phase-based execution with atomic commits | — Pending |
| npm as package manager | User preference | — Pending |
| Keep 4K with warning (not disable) | User plans to upgrade to Vercel Pro | — Pending |
| Blob URL for downloads (not base64 data URL) | Memory-efficient for large 4K images | — Pending |

---
*Last updated: 2026-02-18 after initialization*
