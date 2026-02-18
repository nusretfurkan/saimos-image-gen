# Requirements: Saimos' Image Gen App

**Defined:** 2026-02-18
**Core Value:** User can generate high-quality images from text prompts or transform uploaded images — instantly, with no friction, no signup, no clutter.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Image Generation

- [ ] **GEN-01**: User can enter a text prompt and generate an image (text-to-image)
- [ ] **GEN-02**: User can upload a reference image (JPEG/PNG/WebP, ≤7MB) and enter a text prompt to generate an edited/transformed image (image-to-image)
- [ ] **GEN-03**: User can toggle thinking level (low/high) to trade speed for quality

### Filters

- [ ] **FILT-01**: User can select aspect ratio from 8 options (1:1, 3:2, 2:3, 4:3, 3:4, 16:9, 9:16, 21:9)
- [ ] **FILT-02**: User can select resolution (1K, 2K, 4K)
- [ ] **FILT-03**: User can see per-image cost indicator next to resolution options

### Image Output

- [ ] **OUT-01**: Generated image displays prominently as the hero element
- [ ] **OUT-02**: User can view generated image in fullscreen (dark overlay, contain-fit, close via X/backdrop/Escape)
- [ ] **OUT-03**: User can download generated image as `saimos-gen-{timestamp}.png`
- [ ] **OUT-04**: User can copy generated image to clipboard
- [ ] **OUT-05**: User can paste image from clipboard into the upload area (image-to-image mode)

### Infrastructure

- [ ] **INFRA-01**: All Gemini API calls go through server-side route (API key never exposed to client)
- [ ] **INFRA-02**: Input validation with specific error messages per PRD error table
- [ ] **INFRA-03**: Content safety filter rejections show appropriate message (not generic error)
- [ ] **INFRA-04**: Timeout handling with clear message for long-running generations
- [ ] **INFRA-05**: App is deployed and accessible on Vercel

### UX Quality

- [ ] **UX-01**: Loading state with spinner and "Generating..." text during generation
- [ ] **UX-02**: Mobile layout is usable and well-proportioned on common phone screen sizes
- [ ] **UX-03**: Desktop layout uses two-column arrangement (controls left, output right)
- [ ] **UX-04**: Only the last generated image is held — no persistence across page refreshes
- [ ] **UX-05**: Uploaded images validated for format (JPEG/PNG/WebP) and size (≤7MB) with client-side feedback
- [ ] **UX-06**: 4K resolution option shows timeout warning for free tier
- [ ] **UX-07**: Error states handled with inline messages and retry option

### Visual Identity

- [ ] **VIS-01**: Soft/pastel aesthetic with sage green accent and cream backgrounds
- [ ] **VIS-02**: Playfair Display (headings) + DM Sans (body) typography
- [ ] **VIS-03**: Distinctive, non-generic design (per frontend-design skill guidelines)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Image Generation

- **GEN-04**: User can engage in multi-turn conversational editing (iterative refinement)
- **GEN-05**: User can upload multiple reference images (up to 14, Gemini native)

### Filters

- **FILT-04**: User can enable Google Search grounding for real-time data in generations

### Image Output

- **OUT-06**: User can pinch-to-zoom on fullscreen view (mobile)

### UX Quality

- **UX-08**: User can see recent prompts for quick re-use

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Personal tool, single user — zero-persistence is the feature |
| Server-side storage / database | Zero persistence by design |
| Image history / gallery | Only last generated image held in browser memory |
| Batch generation | Gemini generates 1 image per request; N calls = N cost, N latency |
| Streaming responses | Gemini returns complete images, nothing to stream progressively |
| Style presets | Prompts are the style control; presets produce generic output |
| Multiple model support | One model (Gemini 3 Pro), deeply integrated |
| Advanced editing (masking, inpainting) | Massive UI complexity; prompt-based editing handles most cases |
| Social sharing | Not a product — user downloads and shares manually |
| PWA / offline support | API wrapper requires internet; no offline use case |
| Cost tracking dashboard | Use Google AI Studio console for usage stats |
| Image format selection | Always PNG output (lossless, universal) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| GEN-01 | — | Pending |
| GEN-02 | — | Pending |
| GEN-03 | — | Pending |
| FILT-01 | — | Pending |
| FILT-02 | — | Pending |
| FILT-03 | — | Pending |
| OUT-01 | — | Pending |
| OUT-02 | — | Pending |
| OUT-03 | — | Pending |
| OUT-04 | — | Pending |
| OUT-05 | — | Pending |
| INFRA-01 | — | Pending |
| INFRA-02 | — | Pending |
| INFRA-03 | — | Pending |
| INFRA-04 | — | Pending |
| INFRA-05 | — | Pending |
| UX-01 | — | Pending |
| UX-02 | — | Pending |
| UX-03 | — | Pending |
| UX-04 | — | Pending |
| UX-05 | — | Pending |
| UX-06 | — | Pending |
| UX-07 | — | Pending |
| VIS-01 | — | Pending |
| VIS-02 | — | Pending |
| VIS-03 | — | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 0
- Unmapped: 26 ⚠️

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-18 after initial definition*
