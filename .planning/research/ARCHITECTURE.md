# Architecture Research

**Domain:** AI image generation web tool (Gemini wrapper, single-page app)
**Researched:** 2026-02-18
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client (Browser)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ PromptInput  │  │ ImageUpload  │  │  ResultDisplay       │  │
│  │ (text entry) │  │ (drag/drop)  │  │  (generated output)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────▲───────────┘  │
│         │                 │                     │               │
│  ┌──────┴─────────────────┴─────────────────────┴───────────┐  │
│  │              Page Component (Client State)                │  │
│  │   mode, prompt, uploadedImage, generatedImage, loading    │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │  fetch("/api/generate", POST, JSON)  │
├─────────────────────────┼───────────────────────────────────────┤
│                      Network                                    │
├─────────────────────────┼───────────────────────────────────────┤
│                      Server                                     │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │           POST /api/generate  (Route Handler)             │  │
│  │   - Validate request (prompt required, image optional)    │  │
│  │   - Strip data URL prefix, extract base64 + mimeType     │  │
│  │   - Build contents array (text Part + inlineData Part)    │  │
│  │   - Call ai.models.generateContent(...)                   │  │
│  │   - Parse response.candidates[0].content.parts            │  │
│  │   - Return { image: "data:mime;base64,...", text: "..." } │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                       │
├─────────────────────────┼───────────────────────────────────────┤
│                   External API                                  │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │         Google Gemini API (gemini-3-pro-image-preview)     │  │
│  │   - Accepts: text Part + optional inlineData Part         │  │
│  │   - Returns: text Part + inlineData Part (base64 PNG)     │  │
│  │   - Config: responseModalities, imageConfig, temperature  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Page Component (`app/page.tsx`) | Owns all client state; orchestrates mode switching, fetch calls, loading/error states | Single `"use client"` component with `useState` hooks for prompt, image, result, loading, error |
| PromptInput | Text prompt entry with submit action | Controlled `<textarea>` + submit button; calls parent `onSubmit(prompt)` |
| ImageUpload | Drag-and-drop or click-to-browse file input; converts file to base64 data URL | `FileReader.readAsDataURL()`; validates file type (PNG/JPEG) and size (<7MB); calls parent `onImageSelect(dataUrl)` |
| ResultDisplay | Shows generated image, optional text description, download button, "edit this" and "reset" actions | Renders `<img src={dataUrl}>`, text block, action buttons |
| ModeSelector | Toggles between text-to-image and image-to-image editing | Two-button toggle or tab; controls whether ImageUpload is shown |
| API Route (`app/api/generate/route.ts`) | Server-side proxy to Gemini; keeps API key secret; validates input; shapes request/response | Next.js Route Handler; `export async function POST(req)` |
| Gemini SDK Client | Singleton `GoogleGenAI` instance initialized with API key from env | `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })` at module scope |

## Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (metadata, fonts, body wrapper)
│   ├── page.tsx            # Single page — "use client", all state lives here
│   ├── globals.css         # Tailwind directives + custom CSS variables
│   ├── api/
│   │   └── generate/
│   │       └── route.ts    # POST handler — Gemini proxy
│   └── favicon.ico
├── components/
│   ├── prompt-input.tsx    # Text prompt form
│   ├── image-upload.tsx    # Drag-and-drop file uploader
│   ├── result-display.tsx  # Generated image + text output
│   ├── mode-selector.tsx   # Text-to-image / image-edit toggle
│   └── ui/                 # Shared primitives (button, card, etc.)
│       ├── button.tsx
│       ├── card.tsx
│       └── textarea.tsx
├── lib/
│   ├── types.ts            # Shared TypeScript interfaces
│   ├── utils.ts            # cn() helper, formatFileSize, etc.
│   └── constants.ts        # Model ID, size limits, aspect ratios
├── public/                 # Static assets (logo, icons)
├── next.config.ts          # Body size limit, standalone output
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Structure Rationale

- **`app/api/generate/`:** Single API route because both modes (text-to-image, image-to-image) use the same Gemini `generateContent` endpoint. The request body carries an optional `image` field to differentiate.
- **`components/`:** Flat folder because this is a small app (~5 components). No need for nested domain folders.
- **`components/ui/`:** Separates reusable design system primitives from feature components. Compatible with shadcn/ui conventions.
- **`lib/`:** Shared code that is not React components. Types, constants, and utilities live here.
- **No `services/` or `hooks/` folders:** The app has one fetch call and simple `useState` hooks. Abstracting into custom hooks or service layers adds indirection without benefit at this scale.

## Architectural Patterns

### Pattern 1: Server-Side API Key Proxy

**What:** The Next.js Route Handler acts as a thin proxy between the browser and the Gemini API. The API key never leaves the server.
**When to use:** Always, for any external API that requires a secret key.
**Trade-offs:** Adds one network hop (browser -> Vercel -> Google), but this is negligible (~10-50ms) compared to image generation time (5-30s). The security benefit is non-negotiable.

**Example:**
```typescript
// app/api/generate/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
  const { prompt, image } = await req.json();

  // Build parts array
  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
    { text: prompt },
  ];

  if (image) {
    const [header, base64] = image.split(",");
    const mimeType = header.includes("image/png") ? "image/png" : "image/jpeg";
    parts.push({ inlineData: { data: base64, mimeType } });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
    },
  });

  // Extract image and text from response
  let resultImage: string | null = null;
  let resultText: string | null = null;

  for (const part of response.candidates![0].content.parts) {
    if ("inlineData" in part && part.inlineData) {
      resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    } else if ("text" in part && part.text) {
      resultText = part.text;
    }
  }

  return NextResponse.json({ image: resultImage, text: resultText });
}
```

### Pattern 2: Base64 Data URL Round-Trip

**What:** Images flow as base64-encoded data URLs throughout the entire system. The browser reads uploaded files as data URLs via `FileReader.readAsDataURL()`, sends them to the API route as JSON strings, the route strips the prefix and passes raw base64 to Gemini, then re-wraps the response base64 as a data URL for the client.
**When to use:** When images are under ~4MB encoded (which covers most use cases with the Vercel 4.5MB body limit) and you want zero external storage.
**Trade-offs:** Base64 inflates file size by ~33% (a 3MB image becomes ~4MB in the JSON body). This directly constrains max upload size. However, it eliminates the need for blob storage, signed URLs, or any persistence layer.

**Example:**
```typescript
// Client: reading uploaded file
const reader = new FileReader();
reader.onload = (e) => {
  const dataUrl = e.target!.result as string;
  // dataUrl = "data:image/png;base64,iVBORw0KGgo..."
  setUploadedImage(dataUrl);
};
reader.readAsDataURL(file);

// Client: sending to API
const res = await fetch("/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt, image: dataUrl }),
});

// Server: extracting base64 for Gemini
const [prefix, base64Data] = image.split(",");
// prefix = "data:image/png;base64"
// base64Data = "iVBORw0KGgo..."
```

### Pattern 3: Stateless Single-Page Architecture

**What:** All state lives in React `useState` hooks in the page component. No database, no session storage, no URL state. Refreshing the page resets everything.
**When to use:** Personal tools, prototypes, and apps where persistence is explicitly not wanted.
**Trade-offs:** Simple to build and reason about. No backend state to manage. Downside: losing work on page refresh. For this project, that is an acceptable trade-off per requirements.

## Data Flow

### Text-to-Image Flow

```
User types prompt → clicks "Generate"
    │
    ▼
Page Component
    │  Validates prompt is non-empty
    │  Sets loading = true
    │
    ▼
fetch("/api/generate", {
  method: "POST",
  body: JSON.stringify({ prompt, image: null })
})
    │
    ▼
Route Handler (server)
    │  Parses JSON body
    │  Builds parts: [{ text: prompt }]
    │  Calls ai.models.generateContent({
    │    model: "gemini-3-pro-image-preview",
    │    contents: parts,
    │    config: { responseModalities: ["TEXT", "IMAGE"], imageConfig: {...} }
    │  })
    │  Waits 5-30 seconds for Gemini response
    │
    ▼
Gemini API responds with candidates[0].content.parts:
    │  Part 1: { text: "description..." }
    │  Part 2: { inlineData: { data: "<base64>", mimeType: "image/png" } }
    │
    ▼
Route Handler builds response:
    │  { image: "data:image/png;base64,<base64>", text: "description..." }
    │
    ▼
Page Component receives JSON response
    │  Sets generatedImage = data.image
    │  Sets description = data.text
    │  Sets loading = false
    │
    ▼
ResultDisplay renders <img src={generatedImage} />
```

### Image-to-Image Editing Flow

```
User uploads image (drag/drop or file picker)
    │
    ▼
FileReader.readAsDataURL(file)
    │  → "data:image/png;base64,iVBOR..."
    │
    ▼
Page Component stores uploadedImage in state
    │
User types editing instruction → clicks "Edit"
    │
    ▼
fetch("/api/generate", {
  method: "POST",
  body: JSON.stringify({
    prompt: "Remove the background and make it transparent",
    image: "data:image/png;base64,iVBOR..."
  })
})
    │
    ▼
Route Handler (server)
    │  Parses JSON body
    │  Splits image data URL → extracts base64 + mimeType
    │  Builds parts: [
    │    { text: prompt },
    │    { inlineData: { data: base64, mimeType: "image/png" } }
    │  ]
    │  Calls ai.models.generateContent(...)
    │
    ▼
(Same response flow as text-to-image)
```

### Key Data Flows

1. **Upload flow:** `File → FileReader.readAsDataURL() → data URL string in React state → JSON body to server → strip prefix → raw base64 to Gemini`
2. **Response flow:** `Gemini inlineData.data (base64) → server wraps as data URL → JSON response to client → <img src={dataUrl}> renders image`
3. **Error flow:** `Any failure → catch in route handler → NextResponse.json({ error }, { status: 500 }) → client shows error message in UI`

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user (personal tool) | Current architecture is perfect. No changes needed. Base64 round-trip is simple and sufficient. |
| 10-100 users | Add rate limiting in the route handler (in-memory counter or Vercel KV). Consider client-side image compression before upload to stay under body limits. |
| 100+ users | Move to blob storage (Vercel Blob, S3) for image transfer instead of base64 in JSON. Add queue-based processing. This is a fundamentally different architecture. |

### Scaling Priorities

1. **First bottleneck: Vercel 4.5MB body size limit.** Large images encoded as base64 will exceed this. Mitigation: client-side compression/resize before upload, or switch to multipart form data with blob storage.
2. **Second bottleneck: Vercel function timeout (300s with Fluid Compute, 60s legacy).** Gemini image generation typically takes 5-30s but can spike. Mitigation: set `maxDuration` in route config, show loading UI, consider streaming status updates.

## Anti-Patterns

### Anti-Pattern 1: Exposing the API Key to the Client

**What people do:** Call the Gemini API directly from browser JavaScript using `GoogleGenAI({ apiKey })` in a `"use client"` component.
**Why it's wrong:** The API key is embedded in the JavaScript bundle, visible to anyone who opens browser DevTools. Anyone can steal it and run up charges.
**Do this instead:** Always call Gemini from a server-side Route Handler (`app/api/*/route.ts`). The API key stays in `process.env` on the server.

### Anti-Pattern 2: Using Server Actions for Long-Running AI Calls

**What people do:** Use Next.js Server Actions (`"use server"` functions) to call the Gemini API, thinking it simplifies the code.
**Why it's wrong:** Server Actions are designed for form mutations, not long-running operations. They have a default 1MB body size limit (configurable, but globally). They cannot return streaming responses. Error handling is less granular than Route Handlers. They also couple your data fetching to React's form action model, which doesn't fit "click generate, wait for image."
**Do this instead:** Use a Route Handler (`export async function POST`) at a dedicated API path. It gives full control over request/response, status codes, headers, and body size.

### Anti-Pattern 3: Storing Generated Images in State as Multiple Copies

**What people do:** Keep the base64 data URL in multiple state variables (history array, current image, previous image) causing memory bloat in the browser.
**Why it's wrong:** Each base64 image string is 1-5MB. Storing 10 iterations means 10-50MB of strings in React state, causing the browser tab to slow down and potentially crash on mobile.
**Do this instead:** For a no-persistence app, keep only the current generated image and prompt in state. If conversation history is needed, store only text parts in history and let the user re-generate rather than storing every intermediate image.

### Anti-Pattern 4: Not Validating Image Size Before Upload

**What people do:** Accept any file the user drops, send it to the API, and let it fail with a 413 error.
**Why it's wrong:** Large files waste the user's upload bandwidth before failing. The error message from Vercel is opaque ("FUNCTION_PAYLOAD_TOO_LARGE").
**Do this instead:** Validate file size client-side before reading it. With a 4.5MB Vercel limit and ~33% base64 inflation, cap raw file uploads at ~3MB (conservative) or ~3.4MB (tight). Show a clear error message with the allowed size.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Gemini API | `@google/genai` SDK via `ai.models.generateContent()` | API key in `GEMINI_API_KEY` env var. Model: `gemini-3-pro-image-preview`. Config includes `responseModalities: ["TEXT", "IMAGE"]`, `imageConfig` for aspect ratio and size. |
| Vercel (hosting) | Deploy via `vercel` CLI or Git push | Free tier: 4.5MB body limit, 300s function timeout (Fluid Compute), 2GB memory. Set `maxDuration` in route config if needed. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Page Component <-> UI Components | Props down, callbacks up | Standard React unidirectional data flow. Page owns all state. Children are presentational + call parent callbacks on user action. |
| Page Component <-> API Route | `fetch()` with JSON body/response | POST `/api/generate`. Request: `{ prompt: string, image?: string }`. Response: `{ image: string, text?: string }` or `{ error: string }`. |
| API Route <-> Gemini SDK | `ai.models.generateContent()` | Synchronous await. No streaming for image generation (Gemini returns the full image at once). Response parsed from `candidates[0].content.parts`. |

## Build Order (Dependency Chain)

The components have clear dependencies that dictate build order:

```
Phase 1: Foundation (no dependencies)
   ├── Project scaffolding (Next.js, TypeScript, Tailwind)
   ├── lib/types.ts (shared interfaces)
   ├── lib/constants.ts (model ID, limits)
   └── next.config.ts (body size limit)

Phase 2: Server (depends on Phase 1)
   └── app/api/generate/route.ts
       ├── Depends on: types, constants, GEMINI_API_KEY env var
       ├── Can be tested independently with curl/Postman
       └── Blocks: nothing can show results without this

Phase 3: UI Components (depends on Phase 1, independent of Phase 2)
   ├── components/ui/* (button, card, textarea)
   ├── components/prompt-input.tsx (needs ui/*)
   ├── components/image-upload.tsx (needs ui/*)
   ├── components/result-display.tsx (needs ui/*)
   └── components/mode-selector.tsx (needs ui/*)

Phase 4: Integration (depends on Phase 2 + Phase 3)
   └── app/page.tsx
       ├── Imports all components
       ├── Wires fetch() to /api/generate
       ├── Manages all state
       └── This is where text-to-image and image-to-image come together

Phase 5: Polish (depends on Phase 4)
   ├── Error handling edge cases
   ├── Loading states and skeleton UI
   ├── Mobile responsiveness tuning
   ├── Client-side image validation/compression
   └── Vercel deployment config
```

**Key dependency insight:** Phases 2 and 3 can be built in parallel. The API route and the UI components have no code dependencies on each other. They only connect through the page component in Phase 4.

## Sources

- [Google Gemini Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation) -- HIGH confidence, official documentation
- [Google @google/genai SDK (js-genai)](https://github.com/googleapis/js-genai) -- HIGH confidence, official SDK repository
- [Google Gemini Image Editing Next.js Quickstart](https://github.com/google-gemini/gemini-image-editing-nextjs-quickstart) -- HIGH confidence, official reference implementation
- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3) -- HIGH confidence, official documentation
- [Vercel Functions Limitations](https://vercel.com/docs/functions/limitations) -- HIGH confidence, official Vercel docs (4.5MB body, 300s timeout, 2GB memory on Hobby)
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) -- HIGH confidence, official Next.js docs
- [Next.js serverActions.bodySizeLimit](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions) -- HIGH confidence, official Next.js docs
- [Vercel Gemini 2.0 Flash Template](https://vercel.com/templates/next.js/gemini-2-0-flash-image-generation-and-editing) -- MEDIUM confidence, template may be updated/deprecated

---
*Architecture research for: AI image generation web tool (Gemini wrapper)*
*Researched: 2026-02-18*
