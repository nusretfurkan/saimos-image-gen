# Roadmap: Saimos Image Gen

## Overview

Deliver a personal, zero-persistence image generation tool wrapping Google Gemini 3 Pro Image. The journey starts with a secure, production-ready API route on Vercel, adds text-to-image generation as the primary value loop, extends to image-to-image editing, applies the distinctive visual identity, and finishes with power-user output actions. Five phases, each delivering a coherent, verifiable capability that builds on the last.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation + API Route** - Project scaffold and secure Gemini proxy deployed to Vercel
- [ ] **Phase 2: Text-to-Image Generation** - Core generation loop with filters, output display, and error handling
- [ ] **Phase 3: Image-to-Image Editing** - Upload reference images and transform them with text prompts
- [ ] **Phase 4: Visual Identity + Responsive Layout** - Distinctive design system and mobile/desktop layouts
- [ ] **Phase 5: Output Actions + Power Features** - Fullscreen view, download, clipboard, and thinking toggle

## Phase Details

### Phase 1: Foundation + API Route
**Goal**: A working, secure Gemini API proxy is deployed to Vercel and handles all generation requests with proper validation and error handling
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. Sending a POST request to the API route with a text prompt returns a generated image (base64 or binary)
  2. Sending a malformed or empty request returns a specific validation error message (not a generic 500)
  3. A prompt that triggers Gemini's safety filter returns a clear "try rephrasing" message (not a success or generic error)
  4. The API key is not present in any client-side JavaScript bundle after build
  5. The app is accessible at a public Vercel URL
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md -- Project scaffold with Next.js 16, dependencies, and shared library modules (gemini client, Zod schemas, constants, types, utils)
- [ ] 01-02-PLAN.md -- Gemini API route handler with Zod validation, safety filter detection, timeout handling, and binary image response
- [ ] 01-03-PLAN.md -- Vercel deployment, environment configuration, and production verification of all success criteria

### Phase 2: Text-to-Image Generation
**Goal**: User can type a prompt, select filters, and see a generated image displayed as the hero element
**Depends on**: Phase 1
**Requirements**: GEN-01, FILT-01, FILT-02, FILT-03, OUT-01, UX-01, UX-04, UX-06, UX-07
**Success Criteria** (what must be TRUE):
  1. User can type a text prompt, hit generate, and see the resulting image displayed prominently on the page
  2. User can select aspect ratio (8 options) and resolution (1K/2K/4K) before generating, and the output matches the selection
  3. User sees per-image cost indicator next to resolution options and a timeout warning when 4K is selected
  4. A spinner with "Generating..." text is visible during the entire generation wait
  5. When generation fails (safety filter, timeout, validation), an inline error message appears with a retry option
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md -- Core generation flow: page orchestrator, prompt input, shared types/constants, fetch logic
- [ ] 02-02-PLAN.md -- Filter controls: aspect ratio pills with shape indicators, resolution pills, cost indicator, 4K warning
- [ ] 02-03-PLAN.md -- Result display: image hero with crossfade, loading overlay with spinner, inline error with retry

### Phase 3: Image-to-Image Editing
**Goal**: User can upload or paste a reference image and transform it using a text prompt
**Depends on**: Phase 2
**Requirements**: GEN-02, OUT-05, UX-05
**Success Criteria** (what must be TRUE):
  1. User can upload a reference image via file picker or drag-and-drop, see a thumbnail preview, and generate an edited version with a text prompt
  2. User can paste an image from clipboard into the upload area and use it as the reference image
  3. Uploading an invalid file (wrong format or >7MB) shows a specific client-side error message before any server request
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md -- Image upload component with validation, resize utility, file picker, and drag-and-drop
- [ ] 03-02-PLAN.md -- Image-to-image generation flow with clipboard paste and before/after result display

### Phase 4: Visual Identity + Responsive Layout
**Goal**: The app has a distinctive, non-generic visual identity and works well on both mobile phones and desktop browsers
**Depends on**: Phase 2
**Requirements**: VIS-01, VIS-02, VIS-03, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. The app uses sage green accent color and cream backgrounds consistently across all components
  2. Headings render in Playfair Display and body text renders in DM Sans
  3. On mobile (< 768px), the layout is a single usable column with well-proportioned controls
  4. On desktop (>= 768px), the layout splits into two columns (controls left, output right)
  5. The overall look is distinctive and does not resemble a generic AI tool template
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — Design tokens (sage green + cream + ink palette, shadows, radii, animations) and Google Fonts loading (Playfair Display + DM Sans)
- [ ] 04-02-PLAN.md — Responsive two-column layout (single-column mobile < 768px, two-column desktop >= 768px)
- [ ] 04-03-PLAN.md — Component visual refinement (buttons, cards, inputs, result display, mode selector, image upload)

### Phase 5: Output Actions + Power Features
**Goal**: User has full control over generated images (view, save, copy) and can tune generation quality
**Depends on**: Phase 2
**Requirements**: OUT-02, OUT-03, OUT-04, GEN-03
**Success Criteria** (what must be TRUE):
  1. User can click the generated image to open a fullscreen dark-overlay view, and close it via X button, backdrop click, or Escape key
  2. User can download the generated image as a PNG file named `saimos-gen-{timestamp}.png`
  3. User can copy the generated image to clipboard with a single click
  4. User can toggle thinking level between low and high, and the generation reflects the chosen quality/speed tradeoff
**Plans**: 2 plans

Plans:
- [ ] 05-01-PLAN.md -- Fullscreen image viewer, download, and copy-to-clipboard actions
- [ ] 05-02-PLAN.md -- Thinking level toggle with API integration

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5
Note: Phases 3, 4, and 5 all depend on Phase 2 but are independent of each other.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + API Route | 0/3 | Not started | - |
| 2. Text-to-Image Generation | 0/3 | Not started | - |
| 3. Image-to-Image Editing | 0/2 | Not started | - |
| 4. Visual Identity + Responsive Layout | 0/3 | Not started | - |
| 5. Output Actions + Power Features | 0/2 | Not started | - |
