# Project Research Summary

**Project:** Saimos Image Gen
**Domain:** Personal AI image generation web tool (Google Gemini 3 Pro Image wrapper)
**Researched:** 2026-02-18
**Confidence:** HIGH

## Executive Summary

Saimos Image Gen is a personal-use, zero-persistence web tool that wraps the Google Gemini 3 Pro Image API. The canonical build pattern for this category is: a Next.js App Router frontend with a server-side Route Handler that proxies all Gemini calls (keeping the API key off the client), React state managing the UI lifecycle, and a stateless base64 round-trip to pass images between the browser and the model. This is a well-documented pattern with an official Google reference implementation. The entire product lives in one API route and five UI components — complexity comes from edge cases, not from architecture.

The recommended approach is to treat this as a two-phase delivery: first, get a fully working core (text-to-image, image-to-image, API route, validation, error handling) deployed to Vercel and verified against real constraints; second, add the polish layer (clipboard interactions, thinking level toggle, UX refinements, rate limiting). The tech stack is exceptionally stable — Next.js 16 + React 19 + TypeScript 5.9 + Tailwind CSS v4 + @google/genai 1.x are all current stable releases with high confidence, and they compose without friction.

The key risks are all infrastructure-layer, not product-layer: the Vercel 4.5 MB body size limit will be hit by high-resolution generated images returned as base64 JSON, Gemini's safety filters block benign prompts silently (requiring explicit no-image-in-response detection), and Gemini 3 Pro's thought signatures must be preserved across editing turns or multi-turn editing fails. All three risks are known, documented, and have clear mitigation strategies. None require architectural changes if addressed in Phase 1.

---

## Key Findings

### Recommended Stack

The stack is fully modern and mutually compatible. Next.js 16 (App Router) with React 19 handles both the UI and the server-side API proxy in a single deployment. TypeScript 5.9 provides full type safety. Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`) covers all styling. The `@google/genai` SDK (v1.x, GA since May 2025) is Google's official unified SDK that replaced the deprecated `@google/generative-ai` package — using the old package is the single most common mistake in new Gemini projects. Vercel Hobby plan is the target deployment platform; its constraints (4.5 MB body, 300s function timeout with Fluid Compute) are well-characterized and must be designed around from day one.

See `.planning/research/STACK.md` for full version compatibility matrix, installation commands, and alternatives considered.

**Core technologies:**
- **Next.js 16 (App Router):** Full-stack framework — App Router Route Handlers keep the Gemini API key server-side; Vercel-native deployment
- **@google/genai 1.x:** Gemini API client — GA SDK with native image generation, thought signature handling, and `inlineData` support
- **Gemini 3 Pro Image (`gemini-3-pro-image-preview`):** AI model — 4K resolution, 10 aspect ratios, multi-turn conversational editing, strong text rendering
- **TypeScript 5.9:** Type safety — required by Next.js 16; Zod 4 requires TS 5.7+
- **Tailwind CSS v4:** Styling — CSS-first config, 5x faster builds, shadcn/ui compatible
- **Zod 4:** Validation — validate all user input before it reaches the Gemini API
- **sonner 2.x:** Toast notifications — generation status, errors, completions

**Critical version note:** Do NOT use `NEXT_PUBLIC_` prefix on the API key, do NOT use `@google/generative-ai` (legacy), do NOT use TypeScript 6.0 beta.

### Expected Features

The feature set is lean by design. The competitive differentiation is what this tool does NOT require (no auth, no signup, no credits, no persistence) rather than feature quantity. Every major AI image tool requires an account; this one opens and works immediately.

See `.planning/research/FEATURES.md` for full prioritization matrix and competitor analysis.

**Must have (table stakes — tool is incomplete without these):**
- Text-to-image generation — core value proposition, single API call
- Image-to-image editing — Gemini 3 Pro's native multimodal strength
- Aspect ratio selection (8 options) — direct API passthrough, pill button UI
- Resolution selection (1K/2K/4K) with per-image cost indicator — API passthrough + static labels
- Image download — essential output mechanism (base64 to Blob URL + `<a download>`)
- Fullscreen image view — modal lightbox for inspecting output quality
- Server-side API key protection — Route Handler pattern, non-negotiable security
- Input validation and error handling (including safety filter detection) — Gemini filters benign prompts frequently
- Mobile-first responsive layout — personal tool used from phone
- Loading states with progress indication — generation takes 5-30+ seconds
- Distinctive visual identity — sage green + cream palette, Playfair Display + DM Sans typography

**Should have (v1.x differentiators — low effort, real workflow value):**
- Thinking level toggle (low/high) — trade speed for quality, no competitor exposes this
- Paste image from clipboard — power-user shortcut, small code, large UX gain
- Copy image to clipboard — paste directly into Figma/Slack, faster than download-then-open

**Defer (v2+):**
- Multi-turn conversational editing with session/context management
- Multiple reference images (Gemini supports up to 14)
- Google Search grounding toggle
- Pinch-to-zoom on fullscreen (mobile)

**Anti-features (never build):** User accounts, image history/gallery, batch generation, advanced masking/inpainting, style presets, multiple model support, streaming/progressive rendering (Gemini returns complete images), social sharing, PWA/offline support.

### Architecture Approach

The architecture is deliberately minimal: a single-page React client with a stateless `app/api/generate/route.ts` proxy. All state lives in `useState` hooks on the page component. Images flow as base64 data URLs in both directions (browser reads files as data URLs, sends them as JSON, route strips the prefix for Gemini, wraps the response as a data URL for rendering). The entire system has one external API dependency (Google Gemini), one deployment target (Vercel), and no persistence layer. Phases 2 (API route) and 3 (UI components) can be built in parallel since they only connect through the page component.

See `.planning/research/ARCHITECTURE.md` for full project structure, code examples, and anti-patterns.

**Major components:**
1. **`app/api/generate/route.ts`** — Server-side Gemini proxy; validates input, builds `parts` array (text + optional `inlineData`), calls `ai.models.generateContent()`, parses `candidates[0].content.parts`, returns `{ image, text }`
2. **`app/page.tsx`** — Page component with all client state (mode, prompt, uploadedImage, generatedImage, loading, error); orchestrates fetch calls and mode switching
3. **`components/prompt-input.tsx`** — Controlled textarea with submit; calls parent `onSubmit(prompt)`
4. **`components/image-upload.tsx`** — Drag-and-drop + file picker; validates format (PNG/JPEG/WebP) and size (<7MB); reads to base64 data URL
5. **`components/result-display.tsx`** — Renders generated image, description text, download button, edit/reset actions

### Critical Pitfalls

All 6 pitfalls in the research are Phase 1 concerns — they must be addressed during initial API integration, not retrofitted in polish.

See `.planning/research/PITFALLS.md` for full details, recovery costs, and a "Looks Done But Isn't" verification checklist.

1. **Vercel 4.5 MB response body limit** — Base64-encoded 2K/4K images exceed the limit, causing silent 413 failures on Vercel (works fine locally). Mitigation: use streaming responses (`new Response(readableStream)`) for 2K/4K resolutions, or return raw binary with `Content-Type: image/png` headers instead of JSON-wrapped base64. Must be addressed before enabling 2K/4K in the UI.

2. **Gemini safety filters silently block benign prompts** — The model returns a text-only response (no image) when filters trigger; a response with HTTP 200 does not mean an image was generated. Mitigation: always check if `inlineData` is present in response parts; show a specific "try rephrasing" error message; do not treat text-only responses as success.

3. **Thought signatures dropped in multi-turn editing** — Gemini 3 Pro requires `thoughtSignature` fields from previous turns to maintain image editing context; dropping them causes 400 errors or context-free regeneration. Mitigation: use the SDK's `ai.chats.create()` interface which handles signatures automatically, or preserve the full response object in conversation history if managing manually.

4. **API key exposed in client bundle** — Using `NEXT_PUBLIC_GEMINI_API_KEY` or importing `@google/genai` in a client component embeds the key in the JS bundle. Mitigation: use `GEMINI_API_KEY` (no prefix), only instantiate `GoogleGenAI` in `app/api/*/route.ts`, verify post-build with `grep -r "GEMINI" .next/static/`.

5. **Base64 memory bloat on mobile** — Raw camera photos (12+ MP = 4-8 MB) exceed the 4.5 MB Vercel request limit and cause mobile browser crashes during iterative editing. Mitigation: client-side resize to max 2048px + compress to JPEG 80% before upload; use `URL.createObjectURL()` for display (not raw base64 strings in state).

---

## Implications for Roadmap

The architecture's build order is explicit and well-reasoned. The API route and UI components are independent and can be built in parallel, but nothing works end-to-end until the page component wires them together. All critical pitfalls are Phase 1 concerns.

### Phase 1: Foundation + Secure API Route

**Rationale:** Nothing else works without the Gemini proxy, and three of the six critical pitfalls (API key exposure, safety filter handling, response body size) must be correct before any UI is meaningful to test. The project scaffold and config also live here.
**Delivers:** A working, deployable API route that accepts `{ prompt, image? }` and returns `{ image, text }` or `{ error }`. Verified on Vercel (not just locally). API key secured. Response body size handled correctly (streaming or binary for 2K/4K).
**Addresses:** Server-side API key protection, input validation, error handling, `maxDuration` config
**Avoids:** API key leakage, 4.5 MB response limit, function timeout on 4K, `NEXT_PUBLIC_` prefix mistake

### Phase 2: Core UI — Text-to-Image

**Rationale:** Text-to-image is the simplest mode (no upload, no thought signatures, no conversation history) and the primary value proposition. Building it first validates the full client-server loop and produces a usable tool faster.
**Delivers:** Working text-to-image generation with prompt input, loading state, result display, download button, fullscreen view, aspect ratio and resolution selection with cost indicator, error messages for safety blocks and timeouts.
**Addresses:** Text-to-image generation, aspect ratio selection, resolution selection, image download, fullscreen view, loading states, error handling, cost indicator
**Avoids:** Generic error messages on safety blocks (must specifically detect no-image responses)

### Phase 3: Image-to-Image Editing

**Rationale:** Depends on Phase 2 result display and Phase 1 API route. Image upload adds moderate UI complexity (drag-and-drop, file validation, preview thumbnail). Thought signature handling is the critical new concern here.
**Delivers:** File upload component with drag-and-drop, click-to-browse, format/size validation, upload preview, and editing mode that correctly passes thought signatures for multi-turn context.
**Addresses:** Image-to-image editing, image upload UI, base64 round-trip, thought signature propagation
**Avoids:** Thought signatures dropped between turns, mobile memory bloat from raw camera photo uploads (client-side resize required here)

### Phase 4: Visual Identity + Mobile Polish

**Rationale:** All functional paths work by Phase 3. Polish the design system (sage green + cream palette, Playfair Display + DM Sans fonts) and tune mobile responsiveness. This is design execution, not engineering.
**Delivers:** Distinctive visual identity that differs from generic AI tool aesthetic. Fully optimized mobile layout. Layout shift prevention (pre-reserved image container). Upload thumbnail preview. Elapsed time counter on loading state.
**Addresses:** Distinctive visual identity, mobile-first responsive layout, UX pitfalls (no upload preview, no progress detail, layout shift)
**Uses:** Tailwind CSS v4 `@theme` directive for custom design tokens; Playfair Display + DM Sans via Google Fonts in `layout.tsx`

### Phase 5: Power-User Features + Security Hardening

**Rationale:** Core is done and used. Add the low-effort differentiators that improve workflow and harden the production deployment.
**Delivers:** Thinking level toggle (low/high `thinkingBudget`), clipboard paste for image upload, copy-to-clipboard for generated image, per-IP rate limiting on the API route.
**Addresses:** Thinking level toggle, paste from clipboard, copy to clipboard, rate limiting (security)
**Avoids:** Unbounded API route abuse (rate limiting), missing power-user ergonomics

### Phase Ordering Rationale

- **API route before UI:** You cannot test the real integration without a deployed API route. Local mock responses hide the Vercel body size and timeout issues that kill the app in production.
- **Text-to-image before image-to-image:** Simpler mode, no upload UI, no thought signatures. Validates the full loop (prompt → API → display → download) with minimal moving parts.
- **Functional before visual:** Design polish (Phase 4) on top of broken flows is wasted effort. Get flows working first, then tune visual identity.
- **Core before power-user features:** Clipboard paste and thinking toggle are v1.x features. They require the core to be stable and personally validated before they're worth the investment.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (API Route):** Streaming vs. binary response strategy for 2K/4K images needs a concrete decision with code example. The research identifies the problem and mitigation options but does not provide a tested implementation for the streaming path. Recommend `/gsd:research-phase` focused on `ReadableStream` response pattern in Next.js Route Handlers with Gemini binary output.
- **Phase 3 (Image-to-Image):** Thought signature handling via `ai.chats.create()` vs. manual history management in a stateless Route Handler is unresolved. The SDK's chat interface requires server-side session state (since the route handler is stateless). Need to determine the correct pattern for a stateless Next.js Route Handler that accepts conversation history from the client. Recommend `/gsd:research-phase` focused on this specific pattern.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Text-to-Image UI):** Well-documented. The official Google Gemini image-editing Next.js quickstart covers this exactly.
- **Phase 4 (Visual Identity):** Design execution, no novel technical patterns. Tailwind v4 `@theme` directive is documented.
- **Phase 5 (Power-User Features):** All features are low-complexity with clear browser API patterns (`navigator.clipboard`, `paste` event, Vercel Edge Middleware for rate limiting).

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry on 2026-02-18. Official docs confirm compatibility matrix. No speculative dependencies. |
| Features | HIGH | Feature set derived from official Gemini API docs (verified capabilities) + direct competitor analysis. Anti-features are well-justified. |
| Architecture | HIGH | Supported by official Google reference implementation (gemini-image-editing-nextjs-quickstart) and official Next.js/Vercel docs. |
| Pitfalls | HIGH | 6 of 6 pitfalls sourced from official docs or multiple corroborating community reports. All have documented recovery strategies. |

**Overall confidence:** HIGH

### Gaps to Address

- **Streaming response implementation for 2K/4K images:** Research identifies the problem and points to `ReadableStream` as the solution, but does not include a tested code path for the full client + server implementation. Address in Phase 1 planning with targeted research.
- **Stateless thought signature management:** The SDK's `ai.chats.create()` is documented for session-based use; how to manage thought signatures in a stateless Route Handler (receiving history from the client on each request) needs a concrete implementation pattern. Address in Phase 3 planning.
- **Gemini 3 Pro Image preview status:** The model is listed as `gemini-3-pro-image-preview` (preview, not GA). Preview models can be deprecated without the standard notice period. The model name should live in a single config constant so it can be updated in minutes. Monitor Google AI changelog.
- **4K generation on Vercel Hobby timeout:** Research reports generation can exceed 60 seconds for 4K. With `maxDuration = 300` and Fluid Compute, this should be within bounds — but needs real-world validation on deployment. Consider marking 4K as "experimental" with a UI warning until confirmed stable.

---

## Sources

### Primary (HIGH confidence)
- [Gemini API Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation) — image generation API, `responseModalities`, `imageConfig`, `inlineData`
- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3) — Gemini 3 Pro capabilities, thinking levels, thought signatures, model ID
- [Gemini 3 Pro Image on Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-pro-image) — aspect ratios, resolution options, input image limits
- [Gemini API Thought Signatures](https://ai.google.dev/gemini-api/docs/thought-signatures) — multi-turn editing context management
- [@google/genai npm package](https://www.npmjs.com/package/@google/genai) — version 1.41.0, GA status, SDK API shape
- [Google Gemini Image Editing Next.js Quickstart](https://github.com/google-gemini/gemini-image-editing-nextjs-quickstart) — official reference implementation
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) — Next.js 16 release, Turbopack stability, React 19 requirement
- [Tailwind CSS v4.0 Blog Post](https://tailwindcss.com/blog/tailwindcss-v4) — v4 architecture, CSS-first config, @theme directive
- [Vercel Functions Limitations](https://vercel.com/docs/functions/limitations) — 4.5 MB body limit, 300s timeout with Fluid Compute, memory
- [Vercel 4.5 MB Body Size Limit KB Article](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions) — streaming workaround
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) — App Router POST handler pattern
- [shadcn/ui Tailwind v4 Docs](https://ui.shadcn.com/docs/tailwind-v4) — Tailwind v4 support, deprecated tailwindcss-animate

### Secondary (MEDIUM confidence)
- [Gemini Safety Filtering Community Reports](https://discuss.google.dev/t/gemini-flash-2-5-image-nano-banana-safety-filtering-problem/260375) — confirms aggressive safety filter behavior on benign prompts
- [Gemini API Latency Issues Forum](https://discuss.ai.google.dev/t/gemini-api-latency-issues/105310) — confirms 15-30s+ generation times
- [Zapier: Best AI Image Generators 2026](https://zapier.com/blog/best-ai-image-generator/) — competitor feature comparison
- [AI Tech Boss: Best AI Image Generators 2026](https://www.aitechboss.com/best-ai-image-generators-2026/) — competitor comparison with hands-on testing
- [Base64 Performance on Mobile](https://medium.com/snapp-mobile/dont-use-base64-encoded-images-on-mobile-13ddeac89d7c) — base64 memory overhead analysis

### Tertiary (LOW confidence)
- [BestPhoto: Best Midjourney Alternatives 2026](https://bestphoto.ai/blog/best-midjourney-alternatives-2026) — some competitor claims, single source

---
*Research completed: 2026-02-18*
*Ready for roadmap: yes*
