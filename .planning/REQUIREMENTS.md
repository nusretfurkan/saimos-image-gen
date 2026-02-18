# Requirements: Saimos' Image Gen App

**Defined:** 2026-02-18
**Core Value:** User can generate high-quality images from text prompts or transform uploaded images — instantly, with no friction, no signup, no clutter.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Image Generation

- [x] **GEN-01**: User can enter a text prompt and generate an image (text-to-image)
- [x] **GEN-02**: User can upload a reference image (JPEG/PNG/WebP, ≤7MB) and enter a text prompt to generate an edited/transformed image (image-to-image)
- [x] **GEN-03**: User can toggle thinking level (low/high) to trade speed for quality

### Filters

- [x] **FILT-01**: User can select aspect ratio from 8 options (1:1, 3:2, 2:3, 4:3, 3:4, 16:9, 9:16, 21:9)
- [x] **FILT-02**: User can select resolution (1K, 2K, 4K)
- [x] **FILT-03**: User can see per-image cost indicator next to resolution options

### Image Output

- [x] **OUT-01**: Generated image displays prominently as the hero element
- [x] **OUT-02**: User can view generated image in fullscreen (dark overlay, contain-fit, close via X/backdrop/Escape)
- [x] **OUT-03**: User can download generated image as `saimos-gen-{timestamp}.png`
- [x] **OUT-04**: User can copy generated image to clipboard
- [x] **OUT-05**: User can paste image from clipboard into the upload area (image-to-image mode)

### Infrastructure

- [x] **INFRA-01**: All Gemini API calls go through server-side route (API key never exposed to client)
- [x] **INFRA-02**: Input validation with specific error messages per PRD error table
- [x] **INFRA-03**: Content safety filter rejections show appropriate message (not generic error)
- [x] **INFRA-04**: Timeout handling with clear message for long-running generations
- [ ] **INFRA-05**: App is deployed and accessible on Vercel

### UX Quality

- [x] **UX-01**: Loading state with spinner and "Generating..." text during generation
- [x] **UX-02**: Mobile layout is usable and well-proportioned on common phone screen sizes
- [x] **UX-03**: Desktop layout uses two-column arrangement (controls left, output right)
- [x] **UX-04**: Only the last generated image is held — no persistence across page refreshes
- [x] **UX-05**: Uploaded images validated for format (JPEG/PNG/WebP) and size (≤7MB) with client-side feedback
- [x] **UX-06**: 4K resolution option shows timeout warning for free tier
- [x] **UX-07**: Error states handled with inline messages and retry option

### Visual Identity

- [x] **VIS-01**: Soft/pastel aesthetic with sage green accent and cream backgrounds
- [x] **VIS-02**: Playfair Display (headings) + DM Sans (body) typography
- [x] **VIS-03**: Distinctive, non-generic design (per frontend-design skill guidelines)

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
| GEN-01 | Phase 2 | Complete |
| GEN-02 | Phase 3 | Complete |
| GEN-03 | Phase 5 | Complete |
| FILT-01 | Phase 2 | Complete |
| FILT-02 | Phase 2 | Complete |
| FILT-03 | Phase 2 | Complete |
| OUT-01 | Phase 2 | Complete |
| OUT-02 | Phase 5 | Complete |
| OUT-03 | Phase 5 | Complete |
| OUT-04 | Phase 5 | Complete |
| OUT-05 | Phase 3 | Complete |
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| INFRA-05 | Phase 1 | Pending |
| UX-01 | Phase 2 | Complete |
| UX-02 | Phase 4 | Complete |
| UX-03 | Phase 4 | Complete |
| UX-04 | Phase 2 | Complete |
| UX-05 | Phase 3 | Complete |
| UX-06 | Phase 2 | Complete |
| UX-07 | Phase 2 | Complete |
| VIS-01 | Phase 4 | Complete |
| VIS-02 | Phase 4 | Complete |
| VIS-03 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-18 after roadmap creation*
