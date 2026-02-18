# Pitfalls Research

**Domain:** AI image generation web tool wrapping Google Gemini 3 Pro Image API
**Researched:** 2026-02-18
**Confidence:** HIGH (verified against official Gemini docs, Vercel docs, and community reports)

## Critical Pitfalls

### Pitfall 1: Vercel 4.5 MB Response Body Limit Silently Kills Image Delivery

**What goes wrong:**
Vercel serverless functions enforce a hard 4.5 MB limit on both request and response bodies. A single 2K PNG image returned as base64 can approach or exceed this limit because base64 encoding inflates binary data by ~33%. A 3 MB PNG becomes ~4 MB in base64, and wrapping it in a JSON response with metadata pushes it over. The function returns a `413 FUNCTION_PAYLOAD_TOO_LARGE` error with no image delivered. At 4K resolution, this is virtually guaranteed to fail.

**Why it happens:**
Developers test locally where there are no payload limits, and everything works. The 4.5 MB limit only manifests on Vercel deployment. Base64's 33% overhead is easy to forget when estimating response sizes.

**How to avoid:**
- Use streaming responses from the route handler. Streaming functions bypass the 4.5 MB limit entirely. Return `new Response(readableStream)` instead of `NextResponse.json()`.
- Return raw binary (PNG/JPEG bytes) with `Content-Type: image/png` headers instead of wrapping base64 in JSON.
- If JSON is required, compress the response or use JPEG output (smaller than PNG) with quality tuning.
- For 4K images: streaming is non-negotiable, or offload to external storage (Vercel Blob) and return a signed URL.

**Warning signs:**
- Images work locally but fail on Vercel with 413 errors
- Larger resolution settings fail while 1K works fine
- Intermittent failures depending on image content complexity (more complex = larger file)

**Phase to address:**
Phase 1 (Core API integration). The response delivery mechanism must be correct from the start; retrofitting streaming later means rewriting both the API route and client-side fetch logic.

---

### Pitfall 2: Gemini Safety Filters Block Benign Prompts Without Explanation

**What goes wrong:**
Gemini's safety filtering operates at multiple layers (prompt filtering, generation monitoring, post-generation review) and frequently blocks benign prompts. Community reports confirm that even prompts like "a ginger tabby cat sleeping on a blue couch" get rejected. The model either returns no image at all, or returns text saying "I'm just a language model and can't help with that" despite acknowledging it would generate the image. Setting `safetySettings` to `BLOCK_NONE` does not fully disable filtering -- core policy violations (child safety, etc.) remain enforced regardless.

**Why it happens:**
Google's multi-layered safety system is deliberately aggressive. The filtering logic is opaque and cannot be fully controlled via the API. Developers assume `BLOCK_NONE` means no filtering, which is false.

**How to avoid:**
- Always check if the response contains image data before assuming success. Parse every part in the response; an empty `inlineData` array or a text-only response means the image was filtered.
- Implement explicit retry logic (2-3 retries with slight prompt variations) for cases where the safety filter triggers on benign content.
- Provide clear user feedback: "The image could not be generated. Try rephrasing your prompt." instead of a generic error.
- Do not promise "any image" in the UI. Set expectations that some prompts may be declined.
- Log filtered prompts for pattern analysis to refine prompt guidelines for users.

**Warning signs:**
- Response has text parts but no image parts
- `finishReason` indicates safety blocking
- Sporadic "works sometimes, fails sometimes" behavior for the same prompt

**Phase to address:**
Phase 1 (Core API integration). Error handling for safety blocks is not optional; it is part of the happy path because it happens frequently.

---

### Pitfall 3: Thought Signatures Not Circulated in Multi-Turn Image Editing

**What goes wrong:**
Gemini 3 Pro Image uses "thought signatures" -- encrypted representations of internal reasoning -- to maintain context across conversation turns. For image editing (image-to-image), the model relies on the `thoughtSignature` from the previous turn to understand composition and editing intent. If you fail to pass back thought signatures in the conversation history, the API returns a 400 validation error, or worse, the model loses context and produces an unrelated image instead of an edit.

**Why it happens:**
Thought signatures are a Gemini 3-specific feature that developers coming from Gemini 2.x won't know about. Most tutorials and quickstarts use the SDK's `chat` interface which handles signatures automatically, but if you build custom conversation history management (required for a stateless API route), you must handle them manually.

**How to avoid:**
- Use the SDK's built-in chat feature (`ai.chats.create()` or equivalent) which handles thought signatures automatically.
- If managing history manually in API routes: always include the full `response` object (including `thoughtSignature` fields) when appending to history. Never strip or filter response parts.
- For the stateless API route pattern: the client must send back the complete conversation history including thought signatures on each request.
- Test multi-turn editing explicitly: generate an image, then request an edit, then request another edit. Verify the chain works end-to-end.

**Warning signs:**
- First image generates fine but subsequent edits produce unrelated images
- 400 errors on the second or third turn of a conversation
- Error message: "Function call `[name]` is missing a `thought_signature`"

**Phase to address:**
Phase 1 (Core API integration). The image editing flow is a primary feature; thought signature handling must be baked into the conversation management from the start.

---

### Pitfall 4: Vercel Function Timeout on 4K Generation and Slow API Responses

**What goes wrong:**
Gemini image generation latency is variable and can be significant. Community reports show Gemini Pro models routinely exceeding 15-30 seconds, with some requests timing out past 60 seconds. 4K image generation takes even longer. On Vercel Hobby plan, the default timeout is 300 seconds (with Fluid Compute), but without it, the default is only 10 seconds. Developers who don't configure `maxDuration` get silent 504 `FUNCTION_INVOCATION_TIMEOUT` errors in production.

**Why it happens:**
Local development has no timeout. Developers don't realize Vercel's default function timeout may be 10 seconds without Fluid Compute. Gemini API latency varies by load, model, and resolution -- a request that takes 8 seconds in testing may take 40 seconds under API load.

**How to avoid:**
- Export `maxDuration` in the route handler: `export const maxDuration = 60;` (or up to 300 with Fluid Compute on Hobby).
- Enable Fluid Compute on Vercel to get 300-second max on Hobby plan.
- Implement client-side timeout handling with user-visible progress indication (spinner, elapsed timer).
- For 4K generation: consider making it explicitly "experimental" in the UI with a warning about longer wait times, or disable it on free tier and only enable for confirmed fast paths.
- Use AbortController with a client-side timeout that matches or slightly exceeds the server timeout to prevent zombie requests.

**Warning signs:**
- Works locally but returns 504 on Vercel
- Larger resolution settings fail more often than smaller ones
- Failures correlate with time of day (Gemini API load patterns)

**Phase to address:**
Phase 1 (Core API integration) for basic timeout config. Phase 2 (Polish) for adaptive UI that communicates wait times based on resolution choice.

---

### Pitfall 5: Base64 Round-Trip Causes Memory Bloat and Quality Degradation on Mobile

**What goes wrong:**
The architecture sends images as base64 strings in both directions (7 MB uploads, 12 MB body limit). On mobile browsers, this creates three problems simultaneously: (1) base64 inflates data by 33%, so a 5 MB image becomes ~6.7 MB in transfer; (2) the browser must hold the full base64 string in memory, decode it, then hold the decoded binary -- roughly 3x the image size in RAM; (3) for image-to-image editing, each round-trip re-encodes and decodes, compounding quality loss from JPEG recompression and accumulating memory pressure that can crash mobile browsers.

**Why it happens:**
Base64 is the simplest approach -- it's what the Gemini API returns and what JSON transport requires. Developers optimize for development speed, not mobile memory constraints. The 33% overhead seems small until you account for the decode buffer and the original image coexisting in memory.

**How to avoid:**
- Client-side: resize and compress images before upload. Cap input images at 2048px on the longest edge. Use canvas-based compression to target < 2 MB before base64 encoding.
- Limit the number of iterative edits on a single image (each iteration degrades quality). After 3-4 edits, suggest starting from the latest output as a fresh base.
- Server-side: return binary image data with proper `Content-Type` headers instead of JSON-wrapped base64, especially for the generated image response.
- Implement `URL.createObjectURL()` on the client to avoid holding base64 strings in memory for display. Convert received base64 to Blob immediately and revoke previous object URLs.
- Monitor memory: use `performance.memory` (Chrome) during development to catch memory growth patterns.

**Warning signs:**
- Mobile browser tabs crash or reload during editing sessions
- Progressive slowdown after multiple edit cycles
- Images appear blurrier after each edit iteration
- "Payload too large" errors on uploads that worked in earlier iterations

**Phase to address:**
Phase 1 (Core API integration) for client-side image compression before upload. Phase 2 (Polish) for binary response streaming and object URL management.

---

### Pitfall 6: API Key Leaked to Client Bundle

**What goes wrong:**
The Gemini API key gets exposed in the client-side JavaScript bundle. Anyone inspecting network requests or the bundle can extract it, use your quota, incur charges on your account, and potentially access associated Google Cloud resources.

**Why it happens:**
Next.js environment variables prefixed with `NEXT_PUBLIC_` are embedded in the client bundle. Developers accidentally use `NEXT_PUBLIC_GEMINI_API_KEY` instead of `GEMINI_API_KEY`, or import the `@google/genai` SDK in a client component instead of only in the server-side route handler. The build succeeds either way, and the key works, so the leak goes unnoticed.

**How to avoid:**
- Never prefix the API key with `NEXT_PUBLIC_`. Use `GEMINI_API_KEY` (server-only).
- Only import and instantiate `@google/genai` inside route handlers (`app/api/*/route.ts`), never in client components or shared utilities that could be bundled for the client.
- Add `GEMINI_API_KEY` to `.gitignore` patterns and use `.env.local` for development.
- Verify with `next build` output: search the `.next/static` directory for the key string to confirm it's not embedded.
- For production: add rate limiting on your own API route to prevent abuse even if the route is discovered.

**Warning signs:**
- API key visible in browser DevTools network requests
- Unexpected billing spikes from Google Cloud
- The `@google/genai` package appears in the client-side bundle analysis

**Phase to address:**
Phase 1 (Core API integration). This is a day-one security concern. The route handler pattern must be correct from the first implementation.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| JSON-wrapped base64 responses instead of binary streaming | Simpler client parsing; single `fetch` + `response.json()` | Hits 4.5 MB Vercel limit; 33% larger payloads; higher mobile memory usage | MVP only, for 1K resolution. Must migrate to streaming before enabling 2K/4K. |
| No client-side image compression before upload | Faster development; send raw camera photos | 7+ MB uploads on mobile networks; slow, unreliable; burns user data | Never acceptable in production for mobile-first app. Implement in Phase 1. |
| Hardcoded model name (`gemini-3-pro-image-preview`) | Works today | Model gets deprecated (like `gemini-2.5-flash-image-preview` was shut down); requires code change to update | Acceptable if model name is in a single config constant. Never scatter across files. |
| No retry logic for API calls | Simpler code; fewer edge cases | Safety filter false positives cause permanent failures; transient 503s kill user sessions | MVP only. Add retry with backoff in Phase 2 at latest. |
| Storing full conversation history on client | No server state; simple architecture | Mobile memory grows linearly with conversation length; thought signatures add bulk | Acceptable with a cap (e.g., last 5 turns max). Implement the cap in Phase 1. |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| @google/genai SDK | Using `responseModalities: ["image"]` (lowercase) or omitting it entirely | Use `responseModalities: ["Text", "Image"]` with exact casing, or use the SDK's `Modality` enum. Omitting defaults to text-only output. |
| @google/genai SDK | Using the deprecated `@google/generative-ai` package | Use `@google/genai` (the unified SDK). The old package no longer receives Gemini 3+ features. |
| @google/genai SDK | Passing `generationConfig` as a separate top-level object | Pass configuration inside the `config` parameter directly: `config: { responseModalities: [...], safetySettings: [...] }` |
| Gemini 3 Pro Image | Not returning `thoughtSignature` in multi-turn history | Always include the complete response object in conversation history. The SDK's chat interface handles this; custom history management must preserve `thoughtSignature` fields. |
| Gemini 3 Pro Image | Using `imageSize: "1k"` (lowercase k) | The `imageSize` parameter requires uppercase: `"1K"`, `"2K"`, `"4K"`. Lowercase silently falls back to default. |
| Vercel Route Handlers | Not exporting `maxDuration` in the route file | Add `export const maxDuration = 60;` at the top of `route.ts`. Without it, the default may be as low as 10 seconds on Vercel without Fluid Compute. |
| Vercel Deployment | Assuming local body size limits match production | Vercel enforces 4.5 MB request/response body limit. Test with production-sized images early. |
| Next.js App Router | Using Pages Router API route patterns (`/pages/api/`) | App Router uses `app/api/*/route.ts` with `export async function POST()`. Don't mix patterns. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Base64 string held in memory alongside decoded Blob | Mobile browser becomes sluggish; tab crashes on older phones | Convert base64 to Blob immediately via `atob()` + `Uint8Array`, create object URL, release base64 string reference | After 2-3 image generations on phones with < 4 GB RAM |
| No client-side resize before upload | Upload takes 10+ seconds on mobile; timeouts on 3G/4G | Use canvas API to resize to max 2048px and compress to JPEG 80% quality before base64 encoding | Immediately on any photo from a modern phone camera (12+ MP = 4-8 MB) |
| Unbounded conversation history | Each request payload grows; eventually hits 4.5 MB upload limit | Cap conversation history at 5 turns; trim oldest turns (preserving latest thought signature) | After 5-8 rounds of image editing |
| JSON.stringify on large base64 strings | Main thread freezes for 100-500ms during serialization | Use `ReadableStream` for response; avoid JSON wrapper for image data | On every 2K+ image response, visible as UI jank |
| No image format negotiation | Returning PNG for photographic content (much larger than JPEG) | Return JPEG for photographic images, PNG only for graphics with transparency | When generated image has photographic content (majority of use cases) |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Using `NEXT_PUBLIC_` prefix for Gemini API key | Key exposed in client bundle; attackers use your quota and billing | Use `GEMINI_API_KEY` (no prefix); only access in server-side route handlers |
| No rate limiting on the API route | Anyone can call your `/api/generate` endpoint at scale, burning your Gemini quota and billing | Implement per-IP rate limiting (e.g., 10 requests/minute) using Vercel Edge Middleware or a library like `rate-limiter-flexible` |
| Passing user prompts directly to Gemini without sanitization | Prompt injection; users craft prompts that bypass safety filters or extract system prompt content | Prepend a system instruction that constrains the model's behavior; validate prompt length (cap at 1000 chars); strip control characters |
| Not validating uploaded image MIME types server-side | Malicious files disguised as images; potential for unexpected API behavior | Validate MIME type and magic bytes on the server, not just the file extension. Accept only `image/jpeg`, `image/png`, `image/webp`. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state during generation (10-30+ second waits) | Users think the app is broken; tap the button repeatedly; duplicate API calls | Show a skeleton/shimmer preview with elapsed time counter; disable the generate button; show "This may take 15-30 seconds" |
| Generic error message when safety filter blocks | Users don't know why it failed; retry the same prompt repeatedly | Detect safety blocks specifically and show "Your prompt may contain content our AI cannot process. Try different wording." |
| No preview of uploaded image before editing | Users upload the wrong image; waste an API call to discover the mistake | Show a thumbnail preview with file size and dimensions; allow removal before submitting |
| Full-page layout shift when generated image loads | Content jumps; user loses scroll position; disorienting on mobile | Reserve space for the image container at the expected aspect ratio before the image loads |
| No way to download or share generated images easily | Users screenshot (lossy, clumsy); lose the image when they close the tab | Provide a "Download" button that triggers a proper file download and a "Copy to clipboard" button |
| Resolution selector without cost/time context | Users always pick 4K, then wait too long or hit timeouts | Show estimated wait time and cost per resolution: "1K (~10s) | 2K (~15s) | 4K (~30s+, may timeout)" |

## "Looks Done But Isn't" Checklist

- [ ] **Image generation route:** Verify it works on Vercel (not just locally) -- test with 2K resolution minimum to catch 4.5 MB limit issues
- [ ] **Safety filter handling:** Confirm the UI gracefully handles a response with text but no image data -- don't just check for HTTP 200
- [ ] **Multi-turn editing:** Test a 3+ turn editing conversation -- verify thought signatures propagate and the model maintains context
- [ ] **Mobile upload:** Test uploading a photo from a real phone camera (12+ MP) -- not a pre-resized test image
- [ ] **Timeout behavior:** Set Vercel to the minimum timeout and verify the client handles 504 gracefully with a user-facing message
- [ ] **API key security:** Run `grep -r "GEMINI" .next/static/` after build to confirm the key is not in the client bundle
- [ ] **Memory on mobile:** Open the app on a phone, generate 5 images in sequence, verify the tab doesn't crash or slow significantly
- [ ] **Error recovery:** Disconnect network mid-generation -- verify the UI recovers (no infinite spinner, no broken state)
- [ ] **Concurrent requests:** Tap "Generate" rapidly -- verify the app doesn't send multiple simultaneous requests or display stale results
- [ ] **Model deprecation resilience:** Verify the model name is in exactly one place (config file or environment variable), not hardcoded in multiple files

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| 4.5 MB response limit hit in production | MEDIUM | Refactor route handler to return binary stream instead of JSON. Update client to use `response.blob()` instead of `response.json()`. ~2-4 hours of work. |
| API key leaked in client bundle | HIGH | Immediately rotate the key in Google Cloud Console. Audit billing for unauthorized usage. Fix the environment variable naming. Redeploy. Check git history for committed `.env` files. |
| Thought signatures lost in editing flow | LOW | Fix history management to preserve full response objects. No data migration needed since there's no persistence. |
| Safety filter blocking legitimate prompts | LOW | Add retry logic with prompt variation. No architectural change needed. ~1 hour. |
| Mobile memory crashes after iterative edits | MEDIUM | Add client-side image compression, implement Blob/object URL pattern, cap conversation history. ~4-6 hours. Requires both client and server changes. |
| Function timeout on 4K generation | LOW | Add `export const maxDuration = 60;` to route handler. Enable Fluid Compute on Vercel dashboard. ~15 minutes. |
| Model deprecated without notice | LOW | Update model name in config constant. Test and redeploy. ~30 minutes if model name was centralized; HIGH if scattered across codebase. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Vercel 4.5 MB response limit | Phase 1: Core API | Deploy to Vercel staging; generate a 2K image; confirm delivery without 413 error |
| Safety filter silent failures | Phase 1: Core API | Send a known-benign prompt that occasionally triggers filters; verify graceful UI fallback |
| Thought signature handling | Phase 1: Core API | Complete a 3-turn edit conversation via the API route; verify image continuity |
| Function timeout | Phase 1: Core API | Verify `maxDuration` export in route handler; generate 2K image on Vercel and confirm no 504 |
| Base64 memory bloat on mobile | Phase 1: Core API (compression), Phase 2: Polish (streaming) | Generate 5 images sequentially on a mid-range phone; monitor for tab crashes |
| API key exposure | Phase 1: Core API | Search client bundle for API key string after build; confirm absent |
| No client-side image resize | Phase 1: Core API | Upload a raw 12 MP photo; verify it's resized before hitting the API route |
| Rate limiting absence | Phase 2: Polish | Hit the API endpoint 20 times in 60 seconds; verify rate limiting kicks in |
| No loading/progress UX | Phase 2: Polish | Generate an image on a slow connection; verify user sees progress indication |
| Model deprecation resilience | Phase 1: Core API | Confirm model name exists in exactly one config location |
| Quality degradation in edit chains | Phase 2: Polish | Perform 5 sequential edits; compare image quality between round 1 and round 5 |

## Sources

- [Gemini API Image Generation Documentation](https://ai.google.dev/gemini-api/docs/image-generation) -- HIGH confidence (official docs)
- [Gemini API Thought Signatures Documentation](https://ai.google.dev/gemini-api/docs/thought-signatures) -- HIGH confidence (official docs)
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing) -- HIGH confidence (official docs)
- [Gemini API Troubleshooting Guide](https://ai.google.dev/gemini-api/docs/troubleshooting) -- HIGH confidence (official docs)
- [Vercel Functions Limitations](https://vercel.com/docs/functions/limitations) -- HIGH confidence (official docs)
- [Vercel 4.5 MB Body Size Limit KB Article](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions) -- HIGH confidence (official docs)
- [Gemini Image Editing Next.js Quickstart (Google)](https://github.com/google-gemini/gemini-image-editing-nextjs-quickstart) -- HIGH confidence (official example)
- [Gemini Safety Filtering Community Reports](https://discuss.google.dev/t/gemini-flash-2-5-image-nano-banana-safety-filtering-problem/260375) -- MEDIUM confidence (community, multiple corroborating reports)
- [Gemini API Latency Issues Forum](https://discuss.ai.google.dev/t/gemini-api-latency-issues/105310) -- MEDIUM confidence (community reports)
- [Base64 Performance on Mobile (Snapp Mobile)](https://medium.com/snapp-mobile/dont-use-base64-encoded-images-on-mobile-13ddeac89d7c) -- MEDIUM confidence (technical analysis)
- [Next.js Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) -- HIGH confidence (official docs)

---
*Pitfalls research for: AI image generation tool wrapping Google Gemini 3 Pro Image API*
*Researched: 2026-02-18*
