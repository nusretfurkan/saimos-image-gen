# Feature Research

**Domain:** AI image generation personal tool (API wrapper for Gemini 3 Pro Image)
**Researched:** 2026-02-18
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features that every AI image generation interface provides. Missing these and the tool feels broken, not minimal.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Text-to-image generation | Core value proposition of any image gen tool. Every competitor (Midjourney, DALL-E, Ideogram, Flux, Leonardo) has this. | LOW | Single API call to Gemini `generateContent` with `responseModalities: ["TEXT", "IMAGE"]`. The model does the work. |
| Image-to-image editing | Gemini 3 Pro's native strength. ChatGPT, Midjourney Editor, and Leonardo all offer this. Users expect it from a tool wrapping a multimodal model. | MEDIUM | Requires image upload UI (drag-and-drop, file picker), base64 encoding, validation (7MB limit, JPEG/PNG/WebP), and sending as `inlineData` alongside prompt. More UI surface than text-to-image. |
| Aspect ratio selection | Every major tool offers aspect ratio control. Midjourney has 10+ ratios, Ideogram has presets, ChatGPT defaults but allows control. Gemini supports 10 ratios natively. | LOW | Pill buttons or segmented control. Values passed directly to `imageConfig.aspectRatio`. No server logic needed beyond passthrough. |
| Resolution selection | Gemini 3 Pro's 1K/2K/4K output is a native API parameter. Users of image gen tools expect to control output quality. | LOW | Three options with cost indicator ($0.134 for 1K/2K, $0.24 for 4K). Pass to `imageConfig.imageSize`. Include Vercel timeout warning for 4K on free tier. |
| Image download | Every image gen tool allows saving output. Users will try to long-press/right-click/save regardless. A dedicated button removes friction. | LOW | Convert base64 to Blob URL, trigger `<a download>` click. Filename: `saimos-gen-{timestamp}.png`. |
| Fullscreen image view | Generated image is the output. Users need to see it at full resolution without UI chrome. Midjourney, Leonardo, Ideogram all have lightbox/fullscreen views. | LOW | Modal overlay with dark backdrop, contain-fit image, close on X/Escape/outside-click. Standard lightbox pattern. |
| Loading state with progress indication | Generation takes 5-30+ seconds depending on resolution and complexity. Every competitor shows progress. Without it, users think the tool is broken. | LOW | Disable button, show spinner + "Generating..." text. Input area stays visible. |
| Error handling with clear messages | API failures, safety filter blocks, timeouts all happen. Every production tool handles these gracefully. Gemini's safety filter will trigger on some prompts. | LOW | Inline error messages (not modals). Specific messages per error type: safety filter (422), timeout (504), API failure (502), validation (400). "Try Again" affordance. |
| Server-side API key protection | Any tool exposing an API key to the client is a security failure. Standard practice: server-side proxy route. | LOW | Next.js API route at `/api/generate`. `GEMINI_API_KEY` from env vars, never shipped to client. |
| Mobile-responsive layout | Over 60% of casual web usage is mobile. Midjourney, ChatGPT, Leonardo all have mobile-optimized interfaces or native apps. A power tool that doesn't work on a phone is only half a tool. | MEDIUM | Mobile-first single column, desktop two-column. Breakpoint-based layout. Touch targets, viewport-aware sizing. More design effort than logic. |
| Input validation | Empty prompts, oversized images, wrong formats. Every tool validates before hitting the API. Prevents wasted API calls and confusing errors. | LOW | Client-side checks: prompt non-empty, image format (JPEG/PNG/WebP), image size (<=7MB). Server-side duplicate validation. Disable generate button until valid. |

### Differentiators (Competitive Advantage)

Features that set this personal tool apart from the generic image gen landscape. For a personal wrapper tool, differentiators are about **workflow efficiency and power-user ergonomics**, not competing with Midjourney on model quality.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Zero-friction interface (no auth, no signup, no credits) | Midjourney requires $10+/mo subscription. ChatGPT requires login. Ideogram requires account. Leonardo has credit limits. This tool: open tab, type prompt, get image. Fastest possible path from idea to image. | LOW | Achieved by architectural decision (no auth, no DB, no persistence). This is a feature of omission — the differentiator is what you *don't* build. |
| Distinctive visual identity (not generic AI tool aesthetic) | Every AI tool looks the same: dark theme, neon accents, techy font. A soft pastel palette (sage green + cream) with Playfair Display typography immediately communicates "this is different." Personal tools should feel personal. | MEDIUM | Tailwind config with custom palette. Playfair Display (display) + DM Sans (body) fonts. Rounded corners, soft shadows. More design refinement than engineering. Depends on frontend-design skill execution. |
| Cost indicator on resolution | No competitor shows per-image cost. For a personal tool burning your own API key, knowing "this 4K image costs $0.24" is valuable information that changes behavior. | LOW | Static label next to resolution pills: "~$0.13" for 1K/2K, "~$0.24" for 4K. No API call needed — prices are known constants. |
| Thinking level control (low/high) | Gemini 3 Pro's unique "thinking" feature lets users trade speed for quality. Low thinking = faster for simple prompts. High thinking = better reasoning for complex compositions. No consumer tool exposes this. | LOW | Toggle or segmented control. Pass `thinkingConfig.thinkingBudget` to API. Low = faster/cheaper, High = slower/better. Depends on: resolution selection (already built). |
| Paste image from clipboard | Competitors require file picker or drag-and-drop. Power users screenshot and Ctrl+V constantly. Clipboard paste is faster than any file picker. | LOW | Listen for `paste` event on the upload area, read `clipboardData.items` for image types. Falls back to file picker. Small code, large workflow improvement. |
| Copy image to clipboard | Download is for saving. Copy-to-clipboard is for immediate use: paste into Figma, Slack, docs. Faster than download-then-open. | LOW | `navigator.clipboard.write()` with `ClipboardItem`. One button alongside Download. Not all browsers support it — degrade gracefully (hide button if unsupported). |

### Anti-Features (Deliberately NOT Building)

Features that seem good but contradict this project's philosophy, add complexity without value, or are explicitly out of scope per PRD.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| User accounts / authentication | "I want to save my images" "I want my own gallery" | Adds auth system, database, session management, password reset flows. Transforms a zero-persistence personal tool into a product. Contradicts core design principle. | Zero persistence is the feature. Open tab, generate, download, close. If you want persistence, use your file system. |
| Image history / gallery | "Let me see my previous generations" | Requires persistence (localStorage at minimum, DB for cross-device). Adds gallery UI, pagination, deletion. Scope creep into product territory. | Hold only the last generated image in component state. User downloads what they want to keep. Clean slate on refresh is by design. |
| Prompt history / saved presets | "Save my favorite prompts" "Recent prompts dropdown" | Requires persistence layer. Adds UI for managing presets (CRUD operations). Small feature, disproportionate complexity. | Browser's own form autofill handles recent inputs. For presets, keep a text file. |
| Batch generation (multiple images per request) | "Generate 4 variations like Midjourney" | Gemini 3 Pro generates 1 image per request (`candidateCount: 1`). Faking batch means N sequential API calls, N times the cost, N times the latency, and UI for a grid of results. | Single image per request. Iterate with prompt adjustments. The model's thinking capability means each single output is higher quality than multiple quick outputs. |
| Advanced editing (masking, inpainting, region selection) | "Let me paint over just this area" | Requires canvas-based editor with brush tools, layer management, mask generation. Massive UI complexity. Midjourney and Adobe Firefly have dedicated teams for this. | Use image-to-image mode with descriptive prompts. Gemini 3 Pro's reasoning handles "change just the background" type instructions well without masking. ChatGPT's Select tool is a product-level feature. |
| Style presets / predefined styles | "Photorealistic" "Anime" "Oil painting" dropdown | Presets oversimplify the prompt space and fight the model's native capabilities. They produce generic results. Power users write better prompts than any preset. | User writes their own style direction in the prompt. The textarea is the style control. |
| Multiple model support | "Let me switch between Flux, DALL-E, Gemini" | Each model has different API shapes, different parameters, different pricing, different auth. Exponential complexity. Turns a focused tool into an aggregator platform. | One model, deeply integrated. Gemini 3 Pro Image is the deliberate choice. If you want Midjourney, use Midjourney. |
| Streaming / progressive image rendering | "Show the image as it generates" | Gemini image generation returns complete images, not progressive data. There is nothing to stream. Faking it with skeleton states adds complexity for no real UX gain when there's already a loading spinner. | Clear loading state with spinner. The 5-30s wait is acceptable for the quality of output. |
| Social sharing (share to Twitter, link sharing) | "Share my creation" | Requires image hosting (persistence), URL generation, OG meta tags, link expiry management. Product feature, not personal tool feature. | Download the image and share it yourself via whatever channel you want. |
| PWA / offline support | "Use it without internet" | Image generation requires an API call to Google's servers. There is no offline mode for an API wrapper. PWA adds service worker complexity for zero benefit. | It's a web app. You need internet to generate images. That's fine. |
| Cost tracking / usage dashboard | "How much have I spent this month?" | Requires logging every API call with cost, persistence, dashboard UI, aggregation logic. Product feature. | Check Google AI Studio console for usage stats. It already tracks this. |
| Real-time collaboration | "Edit images together" | Product feature requiring WebSocket infrastructure, conflict resolution, presence indicators. Absurd for a personal tool. | It's a personal tool. There is one user. |
| Image format selection (PNG/JPEG/WebP output) | "Let me choose the output format" | Gemini returns PNG by default. Converting server-side adds processing. Most users don't care about format — they care about the image. | Always return PNG (lossless, universal support). If user needs JPEG, they convert locally. |

## Feature Dependencies

```
[Text-to-Image Generation]
    (standalone — no dependencies)

[Image-to-Image Editing]
    └──requires──> [Image Upload UI] (drag-and-drop, file picker, validation)
    └──requires──> [Base64 Encoding] (client-side image processing)

[Aspect Ratio Selection]
    (standalone — UI control + API passthrough)

[Resolution Selection]
    └──enhances──> [Cost Indicator] (cost varies by resolution)
    └──enhances──> [Timeout Warning] (4K may exceed Vercel free tier 60s limit)

[Fullscreen View]
    └──requires──> [Generated Image Display] (needs an image to fullscreen)

[Image Download]
    └──requires──> [Generated Image Display] (needs an image to download)

[Copy to Clipboard]
    └──requires──> [Generated Image Display] (needs an image to copy)

[Paste from Clipboard]
    └──enhances──> [Image-to-Image Editing] (faster image input method)

[Thinking Level Control]
    (standalone — API parameter, independent toggle)

[Distinctive Visual Identity]
    (standalone — design/styling layer, no functional dependencies)

[Cost Indicator]
    └──requires──> [Resolution Selection] (costs are resolution-dependent)
```

### Dependency Notes

- **Image-to-Image requires Image Upload UI:** The editing mode's entire UX depends on a functional upload component with drag-and-drop, file picker, format validation, size validation, and preview thumbnail.
- **Cost Indicator requires Resolution Selection:** Cost information is meaningless without the resolution control it annotates. Build together.
- **Paste from Clipboard enhances Image-to-Image:** Clipboard paste is an alternative input path for the image upload. It does not replace file picker/drag-and-drop — it supplements it.
- **Fullscreen/Download/Copy all require Generated Image Display:** All image action buttons depend on having an image in state. They should appear only after successful generation.

## MVP Definition

### Launch With (v1)

Minimum viable personal tool. Enough to validate that the Gemini wrapper concept works and is useful.

- [x] Text-to-image generation — core value proposition, simplest mode
- [x] Image-to-image editing — second core mode, leverages Gemini 3 Pro's multimodal strength
- [x] Aspect ratio selection (8 options) — direct API passthrough, low effort
- [x] Resolution selection (1K/2K/4K) with cost indicator — direct API passthrough + static labels
- [x] Image download — essential output mechanism
- [x] Fullscreen image view — essential for inspecting output quality
- [x] Server-side API route with key protection — security requirement
- [x] Input validation and error handling — safety filter handling is critical for Gemini
- [x] Mobile-first responsive layout — personal tool used from phone
- [x] Loading states — generation takes 5-30s, must communicate progress
- [x] Distinctive visual identity — sage green + cream palette, Playfair Display + DM Sans

### Add After Validation (v1.x)

Features to add once the core is working and you've used it enough to confirm they'd actually help your workflow.

- [ ] Thinking level toggle (low/high) — add when you notice speed vs. quality tradeoff matters for your use patterns
- [ ] Paste image from clipboard — add when you find yourself constantly screenshotting and wanting to edit
- [ ] Copy image to clipboard — add when you notice you're downloading just to paste into another app
- [ ] Pinch-to-zoom on fullscreen (mobile) — add if you frequently need to inspect fine details on phone

### Future Consideration (v2+)

Features to defer until the tool has proven its value through sustained personal use.

- [ ] Prompt history (recent prompts) — only if you find yourself retyping similar prompts repeatedly
- [ ] Multi-turn conversational editing — Gemini supports this natively, but requires session/context management
- [ ] Multiple reference images — Gemini supports up to 14, useful for character consistency work
- [ ] Google Search grounding toggle — Gemini 3 Pro can ground generations in real-time web data

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Text-to-image generation | HIGH | LOW | P1 |
| Image-to-image editing | HIGH | MEDIUM | P1 |
| Aspect ratio selection | MEDIUM | LOW | P1 |
| Resolution selection + cost indicator | MEDIUM | LOW | P1 |
| Image download | HIGH | LOW | P1 |
| Fullscreen view | MEDIUM | LOW | P1 |
| Loading states | HIGH | LOW | P1 |
| Error handling (incl. safety filters) | HIGH | LOW | P1 |
| Server-side API route | HIGH | LOW | P1 |
| Input validation | HIGH | LOW | P1 |
| Mobile-first layout | HIGH | MEDIUM | P1 |
| Distinctive visual identity | MEDIUM | MEDIUM | P1 |
| Thinking level toggle | MEDIUM | LOW | P2 |
| Paste from clipboard | MEDIUM | LOW | P2 |
| Copy to clipboard | MEDIUM | LOW | P2 |
| Pinch-to-zoom (fullscreen) | LOW | LOW | P3 |
| Multi-turn editing | MEDIUM | HIGH | P3 |
| Multiple reference images | LOW | MEDIUM | P3 |
| Search grounding toggle | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch — the tool is incomplete without these
- P2: Should have, add in v1.x — small effort, real workflow improvement
- P3: Nice to have, v2+ — requires usage patterns to justify

## Competitor Feature Analysis

| Feature | Midjourney | ChatGPT (GPT-4o) | Ideogram | Leonardo AI | Our Approach |
|---------|------------|-------------------|----------|-------------|--------------|
| Text-to-image | Yes (4 variations) | Yes (1 image, slow) | Yes | Yes (multiple models) | Yes (1 image via Gemini 3 Pro) |
| Image-to-image editing | Yes (Editor tool) | Yes (conversational) | Limited | Yes (canvas) | Yes (upload + prompt) |
| Aspect ratio control | 10+ ratios via parameter | Limited | Presets | Multiple options | 8 ratios (Gemini API native) |
| Resolution control | Upscale after generation | Single resolution | Standard | Upscaler tool | 1K/2K/4K at generation time |
| Text rendering | Poor (~40% accuracy) | Good | Excellent (~95%) | Moderate | Good (Gemini 3 Pro's strength) |
| Style presets | Stylize parameter (4 levels) | None (prompt-based) | Predefined styles | Templates/blueprints | None (prompt-based, by design) |
| Batch generation | 4 per request | 1 per request | Multiple | Multiple | 1 per request |
| Auth required | Yes ($10+/mo) | Yes (free tier available) | Yes (free tier) | Yes (credits) | No |
| Cost visibility | Subscription-based | Subscription-based | Subscription-based | Credit-based | Per-image cost shown |
| Mobile experience | Web app | ChatGPT app | Web app | Native iOS/Android | Mobile-first web |
| Persistence | Cloud gallery | Chat history | Cloud gallery | Cloud gallery | None (by design) |
| Thinking/reasoning | None | Inherent in LLM | None | None | Configurable (low/high) |

## Sources

- [Gemini API Image Generation docs](https://ai.google.dev/gemini-api/docs/image-generation) — HIGH confidence, official Google documentation. Verified aspect ratios, resolutions, parameters, capabilities.
- [Gemini 3 Pro Image on Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-pro-image) — HIGH confidence, official Google Cloud documentation. Verified model specs: 14 images input, 65k context, supported formats.
- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3) — HIGH confidence, official Google documentation. Verified thinking levels, thought signatures, grounding capabilities.
- [Zapier: Best AI Image Generators 2026](https://zapier.com/blog/best-ai-image-generator/) — MEDIUM confidence, reputable third-party comparison.
- [AI Tech Boss: Best AI Image Generators 2026](https://www.aitechboss.com/best-ai-image-generators-2026/) — MEDIUM confidence, third-party comparison with hands-on testing.
- [PXZ.ai: Ideogram vs Midjourney 2026](https://pxz.ai/blog/ideogram-vs-midjourney-2026) — MEDIUM confidence, third-party comparison with text accuracy testing data.
- [Cybernews: Midjourney Review 2026](https://cybernews.com/ai-tools/midjourney-review/) — MEDIUM confidence, third-party review.
- [OpenAI: Introducing 4o Image Generation](https://openai.com/index/introducing-4o-image-generation/) — HIGH confidence, official OpenAI documentation.
- [BestPhoto: Best Midjourney Alternatives 2026](https://bestphoto.ai/blog/best-midjourney-alternatives-2026) — LOW confidence, single source for some claims.

---
*Feature research for: AI image generation personal tool (Gemini 3 Pro Image wrapper)*
*Researched: 2026-02-18*
