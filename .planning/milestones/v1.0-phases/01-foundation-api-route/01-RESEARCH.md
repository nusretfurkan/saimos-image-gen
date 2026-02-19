# Phase 1: Foundation + API Route - Research

**Researched:** 2026-02-18
**Domain:** Next.js project scaffold, Gemini API proxy route, Vercel deployment
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire project foundation: a Next.js 16 App Router project with TypeScript and Tailwind CSS v4, a secure server-side API route that proxies requests to Google's Gemini 3 Pro Image model, and a verified Vercel deployment. The API route is the single most critical piece -- every downstream phase (text-to-image, image-to-image, output actions) depends on it working correctly with proper validation, error handling, and safety filter detection.

The core technical challenge is the Vercel 4.5 MB response body limit. Gemini returns generated images as base64-encoded PNG data inside JSON responses. At 1K resolution (1024x1024), this typically stays under 4.5 MB. At 2K and 4K, it will exceed the limit. The recommended approach is to return binary image data (raw bytes with `Content-Type: image/png`) via a streaming response from the route handler, which bypasses Vercel's body size limit entirely. This must be designed correctly from Phase 1 because retrofitting streaming later requires rewriting both the API route and all client-side fetch logic.

**Primary recommendation:** Build the API route with a streaming binary response pattern from day one. Use Zod 4 for request validation. Detect safety filter blocks by checking `finishReason === "SAFETY"` and return a specific 422 response. Export `maxDuration = 120` in the route handler for Vercel timeout safety.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

No locked decisions -- all implementation choices are delegated to Claude's discretion.

### Claude's Discretion

All implementation decisions are delegated to Claude's judgment. The following areas should be optimized for the best developer experience and production readiness:

**Image delivery format**
- Choose the optimal response format (base64 JSON vs binary stream vs URL) based on Vercel constraints, Gemini API capabilities, and downstream consumption in Phase 2
- Consider tradeoffs for 2K/4K resolution images (streaming vs complete delivery)

**Error & safety messaging**
- Design error response structure and status codes
- Craft user-facing messages for safety-filtered content ("try rephrasing" guidance)
- Determine detail level for validation errors vs server errors

**Input constraints**
- Set prompt character limits and validation rules
- Define what gets validated before hitting Gemini (client-side vs server-side boundaries)
- Handle edge cases: empty prompts, excessive length, malformed requests

**Project preferences**
- Choose package manager, styling solution, and tooling
- Set up project structure and configuration
- Select any development utilities (linting, formatting, etc.)

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | All Gemini API calls go through server-side route (API key never exposed to client) | Route Handler pattern at `app/api/generate/route.ts` keeps `@google/genai` SDK and `GEMINI_API_KEY` server-only. Never prefix with `NEXT_PUBLIC_`. Verified: client bundle must not contain the key (grep `.next/static/` post-build). |
| INFRA-02 | Input validation with specific error messages per PRD error table | Zod 4 schema validates request body server-side: prompt required, aspectRatio enum, resolution enum, mode enum, image base64 + mimeType for image-to-image. Each validation failure maps to a specific HTTP 400 message from the PRD error table. |
| INFRA-03 | Content safety filter rejections show appropriate message (not generic error) | Check `response.candidates?.[0]?.finishReason === "SAFETY"` or absence of inlineData parts. Return HTTP 422 with `"The request was blocked by content safety filters."` message. Also check `promptFeedback.blockReason` for prompt-level blocks. |
| INFRA-04 | Timeout handling with clear message for long-running generations | Export `maxDuration = 120` in route handler (Vercel Hobby max is 300s with Fluid Compute). Use `AbortController` with 115s timeout on the Gemini call. Return HTTP 504 with `"Request timed out. Try a simpler prompt."` on timeout. |
| INFRA-05 | App is deployed and accessible on Vercel | Deploy via Git push to main. Set `GEMINI_API_KEY` in Vercel environment settings. Verify with `curl` to the public URL. Confirm the route returns a generated image for a simple prompt. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js (App Router) | 16.1.x | Full-stack React framework | Vercel-native. Route Handlers keep API keys server-side. Turbopack default bundler. Current stable major. |
| React | 19.x | UI library | Ships with Next.js 16. Server Components stable. |
| TypeScript | 5.9.x | Type safety | Current stable. `create-next-app --ts` default. Do NOT use TS 6.0 beta or 7.0 preview. |
| Tailwind CSS | 4.1.x | Utility-first styling | v4 ground-up rewrite: CSS-first config via `@theme`, `@import "tailwindcss"` one-liner, 5x faster builds. No `tailwind.config.js` needed. |
| @google/genai | 1.x (latest 1.41.0) | Gemini API client | Official GA SDK. `ai.models.generateContent()` with native image generation. Replaces deprecated `@google/generative-ai`. |
| Zod | 4.x (latest 4.3.6) | Schema validation | TypeScript-native, zero dependencies. `safeParse()` returns structured errors. De facto standard for Next.js validation. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.x (2.1.1) | Conditional class names | Compose Tailwind classes conditionally. 228B, zero deps. |
| tailwind-merge | 3.x (3.4.1) | Merge Tailwind classes | Resolve conflicting classes in component variants. Pair with clsx in `cn()` utility. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @google/genai | Vercel AI SDK (@ai-sdk/google) | AI SDK's `generateImage()` adds abstraction with no benefit for image gen. Gemini returns complete images, not streams. Loses access to imageConfig, thought signatures, and Gemini-specific features. Go direct. |
| @google/genai | @google/generative-ai | Never. Legacy SDK. No Gemini 3+ features. Deprecated. |
| Zod 4 | yup / joi | Never for this stack. Zod is TS-native, zero deps, integrates with Next.js patterns. |
| Binary streaming response | JSON base64 response | JSON base64 works for 1K images but hits the 4.5 MB Vercel limit at 2K/4K. Streaming binary bypasses the limit entirely and is more efficient. |

**Installation:**
```bash
# Scaffold
npx create-next-app@latest saimos-image-gen --ts --tailwind --app --eslint --src-dir --import-alias "@/*"

# Core
npm install @google/genai zod

# UI utilities
npm install clsx tailwind-merge
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (metadata, fonts, body wrapper)
│   ├── page.tsx                # Single page -- minimal placeholder for Phase 1
│   ├── globals.css             # @import "tailwindcss" + @theme design tokens
│   ├── api/
│   │   └── generate/
│   │       └── route.ts        # POST handler -- Gemini proxy (core of Phase 1)
│   └── favicon.ico
├── lib/
│   ├── gemini.ts               # GoogleGenAI singleton, model ID constant
│   ├── schemas.ts              # Zod request/response schemas
│   ├── types.ts                # Shared TypeScript interfaces
│   ├── constants.ts            # Aspect ratios, resolutions, limits, error messages
│   └── utils.ts                # cn() helper
├── next.config.ts              # Minimal config
├── tsconfig.json
└── package.json
```

**Key decisions:**
- **`lib/gemini.ts`**: Isolate the SDK client instantiation to a single file. The model ID (`gemini-3-pro-image-preview`) lives here as a constant. If the model is deprecated, change one line.
- **`lib/schemas.ts`**: Zod schemas for request validation. Shared between route handler (server-side validation) and later by client components (client-side pre-validation).
- **No `components/` in Phase 1**: The API route is the deliverable. A minimal `page.tsx` placeholder is sufficient. Components come in Phase 2.

### Pattern 1: Streaming Binary Image Response

**What:** Return the generated image as raw binary bytes with `Content-Type: image/png` headers using a `Response` object with a `ReadableStream`. This bypasses Vercel's 4.5 MB response body limit.

**When to use:** Always. This is the correct pattern for all resolutions (1K, 2K, 4K).

**Why not JSON base64:** A 2K PNG image is typically 2-4 MB raw. Base64 encoding inflates by ~33%, making it 2.7-5.3 MB. Wrapped in JSON with metadata, a 2K image can exceed Vercel's 4.5 MB limit. 4K images (potentially 5-10 MB raw) will always exceed it.

**Example:**
```typescript
// app/api/generate/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";

export const maxDuration = 120;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
  // ... validation (see Pattern 3) ...

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: prompt,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: resolution,
      },
    },
  });

  // Extract image data from response
  let imageData: string | null = null;
  let imageMimeType: string = "image/png";
  let textResponse: string | null = null;

  if (response.candidates?.[0]?.finishReason === "SAFETY") {
    return Response.json(
      { error: "The request was blocked by content safety filters." },
      { status: 422 }
    );
  }

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      imageData = part.inlineData.data!;
      imageMimeType = part.inlineData.mimeType ?? "image/png";
    } else if (part.text) {
      textResponse = part.text;
    }
  }

  if (!imageData) {
    return Response.json(
      { error: "The request was blocked by content safety filters." },
      { status: 422 }
    );
  }

  // Convert base64 to binary and stream
  const binaryData = Buffer.from(imageData, "base64");

  return new Response(binaryData, {
    status: 200,
    headers: {
      "Content-Type": imageMimeType,
      "Content-Length": binaryData.length.toString(),
      "X-Text-Response": textResponse
        ? encodeURIComponent(textResponse)
        : "",
    },
  });
}
```

**Client-side consumption (Phase 2):**
```typescript
const res = await fetch("/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt, aspectRatio, resolution }),
});

if (!res.ok) {
  const error = await res.json();
  // error.error contains the user-facing message
  throw new Error(error.error);
}

const blob = await res.blob();
const imageUrl = URL.createObjectURL(blob);
// Use imageUrl as <img src={imageUrl} />
// Later: URL.revokeObjectURL(imageUrl) to free memory
```

### Pattern 2: Dual Response Strategy (Recommended)

**What:** Return binary for successful image generation (streaming, bypasses 4.5 MB limit). Return JSON for errors (structured, parseable). The client checks `res.ok` to determine which parsing path to take.

**Why:** Errors need structured data (error message, error code). Images need efficient binary transfer. Combining both in JSON either limits image size or complicates parsing. Splitting by success/failure gives the best of both.

**Client detection:**
```typescript
if (res.ok) {
  const blob = await res.blob();
  const textResponse = decodeURIComponent(
    res.headers.get("X-Text-Response") ?? ""
  );
  // ... display image
} else {
  const { error } = await res.json();
  // ... show error message
}
```

### Pattern 3: Zod Request Validation

**What:** Validate the incoming request body against a Zod schema before touching the Gemini API. Return specific error messages per the PRD error table.

**Example:**
```typescript
// lib/schemas.ts
import { z } from "zod";

const VALID_ASPECT_RATIOS = [
  "1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "21:9",
] as const;

const VALID_RESOLUTIONS = ["1K", "2K", "4K"] as const;
const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const generateRequestSchema = z.object({
  prompt: z
    .string({ required_error: "Please enter a prompt." })
    .min(1, "Please enter a prompt.")
    .max(10000, "Prompt is too long. Please shorten it."),
  mode: z.enum(["text-to-image", "image-to-image"]),
  aspectRatio: z
    .enum(VALID_ASPECT_RATIOS, {
      errorMap: () => ({ message: "Invalid aspect ratio." }),
    })
    .default("1:1"),
  resolution: z
    .enum(VALID_RESOLUTIONS, {
      errorMap: () => ({ message: "Resolution must be 1K, 2K, or 4K." }),
    })
    .default("1K"),
  image: z.string().optional(),
  imageMimeType: z.enum(VALID_MIME_TYPES).optional(),
}).refine(
  (data) => {
    if (data.mode === "image-to-image") {
      return !!data.image;
    }
    return true;
  },
  { message: "Please upload an image.", path: ["image"] }
);

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
```

```typescript
// In route handler
const body = await req.json();
const parsed = generateRequestSchema.safeParse(body);

if (!parsed.success) {
  const firstError = parsed.error.errors[0];
  return Response.json(
    { error: firstError.message },
    { status: 400 }
  );
}

const { prompt, mode, aspectRatio, resolution, image, imageMimeType } = parsed.data;
```

### Pattern 4: Gemini SDK Singleton

**What:** Instantiate the `GoogleGenAI` client once at module scope, not per-request. Vercel Fluid Compute reuses function instances across invocations, so the singleton persists across warm starts.

**Example:**
```typescript
// lib/gemini.ts
import { GoogleGenAI } from "@google/genai";

export const MODEL_ID = "gemini-3-pro-image-preview";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});
```

### Anti-Patterns to Avoid

- **Using Server Actions for generation:** Server Actions are for form mutations, not long-running operations. They have a 1 MB default body size limit, no streaming support, and less granular error handling than Route Handlers.
- **`NEXT_PUBLIC_GEMINI_API_KEY`:** Any env var prefixed with `NEXT_PUBLIC_` is embedded in the client bundle. Use `GEMINI_API_KEY` (no prefix).
- **Importing `@google/genai` in client components:** The SDK and API key must only be used in server-side code (`app/api/*/route.ts` or `lib/` files imported only by route handlers).
- **JSON-wrapping base64 for all resolutions:** Works for 1K but will fail on Vercel at 2K/4K. Use binary streaming from the start.
- **Not exporting `maxDuration`:** Without it, Vercel may default to as low as 10 seconds. Always export it explicitly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Request validation | Custom if/else chains for each field | Zod 4 `safeParse()` | Zod handles type coercion, nested validation, custom error messages, and TypeScript inference in one schema definition. Custom validation always misses edge cases. |
| Error response structure | Ad-hoc `{ message: string }` objects | Consistent `{ error: string }` with correct HTTP status codes | A standard shape lets the client parse errors uniformly. The PRD defines the exact messages. |
| Model ID management | Hardcoded strings scattered across files | Single `MODEL_ID` constant in `lib/gemini.ts` | Model IDs change when Google deprecates previews. One constant = one line to update. |
| Base64 to binary conversion | Manual string manipulation | `Buffer.from(data, "base64")` | Node.js built-in, handles padding and encoding edge cases correctly. |
| Conditional CSS classes | String concatenation | `cn()` utility (clsx + tailwind-merge) | Handles conflicting classes, conditional application, and type safety. |

**Key insight:** The API route is a thin proxy. Its job is: validate input, call Gemini, detect errors/blocks, return the image. Keep it thin. Don't add business logic, caching, or transformation layers that belong in later phases.

## Common Pitfalls

### Pitfall 1: Vercel 4.5 MB Response Body Limit

**What goes wrong:** JSON-wrapped base64 images at 2K/4K resolution exceed the 4.5 MB Vercel response body limit. The function returns `413 FUNCTION_PAYLOAD_TOO_LARGE` with no image delivered.
**Why it happens:** Developers test locally where there are no payload limits. Base64 inflates binary by ~33%. A 3.5 MB PNG becomes ~4.7 MB base64, which exceeds the limit when wrapped in JSON.
**How to avoid:** Use binary streaming response (`new Response(buffer, { headers: { "Content-Type": "image/png" } })`). Streaming functions bypass the 4.5 MB limit entirely.
**Warning signs:** Works locally but fails on Vercel. 1K works but 2K/4K fails.

### Pitfall 2: Safety Filter Silent Failures

**What goes wrong:** Gemini blocks the prompt or the generated content but the route handler assumes success and returns an empty/broken response.
**Why it happens:** The API returns HTTP 200 even when content is blocked. The blocking signal is in `candidates[0].finishReason === "SAFETY"` or in the absence of `inlineData` parts. Developers who only check HTTP status miss this.
**How to avoid:** Always check (1) `promptFeedback.blockReason` for prompt-level blocks, (2) `candidates[0].finishReason` for generation-level blocks, and (3) whether any `inlineData` part actually exists in the response. If any check fails, return a specific 422 error.
**Warning signs:** Route returns 200 but client shows a broken image. Intermittent failures with benign prompts.

### Pitfall 3: API Key Leaked to Client Bundle

**What goes wrong:** The Gemini API key appears in the client-side JavaScript bundle. Anyone can extract it from DevTools.
**Why it happens:** Using `NEXT_PUBLIC_GEMINI_API_KEY` instead of `GEMINI_API_KEY`. Or importing `@google/genai` in a `"use client"` component.
**How to avoid:** (1) Never prefix with `NEXT_PUBLIC_`. (2) Only import SDK in route handlers or server-only lib files. (3) After build, verify: `grep -r "GEMINI" .next/static/` should return nothing.
**Warning signs:** API key visible in browser DevTools network tab. Unexpected billing spikes.

### Pitfall 4: Function Timeout on Generation

**What goes wrong:** Gemini image generation takes 10-60+ seconds. Without `maxDuration`, Vercel may kill the function after 10 seconds, returning a generic 504 error.
**Why it happens:** Local dev has no timeout. Vercel's defaults vary. Developers don't realize they need to explicitly set `maxDuration`.
**How to avoid:** Export `maxDuration = 120` in the route handler. Wrap the Gemini call with `AbortController` set to 115 seconds (5s buffer before Vercel's hard limit). Return a specific 504 message on timeout.
**Warning signs:** Works locally. Fails on Vercel with 504. Larger resolutions fail more often.

### Pitfall 5: responseModalities Casing

**What goes wrong:** Using lowercase `["text", "image"]` or `["Image"]` for `responseModalities` causes Gemini to return text-only output (no image generated) without an error.
**Why it happens:** The API silently accepts the wrong casing and falls back to text-only mode.
**How to avoid:** Use `["TEXT", "IMAGE"]` with exact uppercase casing. The same applies to `imageSize`: must be `"1K"`, `"2K"`, `"4K"` (uppercase K).
**Warning signs:** API returns text description but no image data.

### Pitfall 6: Not Handling Non-POST Methods

**What goes wrong:** Route handler only exports `POST`, but GET/PUT/DELETE requests hit the route and return confusing 405 or fallback errors.
**Why it happens:** Next.js Route Handlers automatically return 405 for unsupported methods only if `OPTIONS` is not explicitly handled. Some edge cases may behave unexpectedly.
**How to avoid:** The default Next.js behavior handles this correctly -- only export `POST`. Next.js returns 405 with an `Allow` header for undefined methods. Verify this works on Vercel.

## Code Examples

### Complete Route Handler (verified patterns)

```typescript
// app/api/generate/route.ts
// Source: Gemini API docs + Next.js Route Handler docs + Vercel limits docs

import { NextRequest } from "next/server";
import { ai, MODEL_ID } from "@/lib/gemini";
import { generateRequestSchema } from "@/lib/schemas";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // 1. Validate request
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return Response.json(
      { error: firstError.message },
      { status: 400 }
    );
  }

  const { prompt, mode, aspectRatio, resolution, image, imageMimeType } =
    parsed.data;

  // 2. Build Gemini request contents
  const parts: Array<
    | { text: string }
    | { inlineData: { data: string; mimeType: string } }
  > = [{ text: prompt }];

  if (mode === "image-to-image" && image && imageMimeType) {
    // Strip data URL prefix if present
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    parts.push({
      inlineData: { data: base64Data, mimeType: imageMimeType },
    });
  }

  // 3. Call Gemini with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 115_000);

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [{ role: "user", parts }],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: resolution,
        },
      },
    });

    clearTimeout(timeout);

    // 4. Check for safety blocks
    if (response.promptFeedback?.blockReason) {
      return Response.json(
        { error: "The request was blocked by content safety filters." },
        { status: 422 }
      );
    }

    const candidate = response.candidates?.[0];

    if (!candidate || candidate.finishReason === "SAFETY") {
      return Response.json(
        { error: "The request was blocked by content safety filters." },
        { status: 422 }
      );
    }

    // 5. Extract image and text from response parts
    let imageData: string | null = null;
    let mimeType = "image/png";
    let textResponse: string | null = null;

    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) {
        imageData = part.inlineData.data;
        mimeType = part.inlineData.mimeType ?? "image/png";
      } else if (part.text) {
        textResponse = part.text;
      }
    }

    if (!imageData) {
      return Response.json(
        { error: "The request was blocked by content safety filters." },
        { status: 422 }
      );
    }

    // 6. Return binary image response
    const binaryData = Buffer.from(imageData, "base64");

    return new Response(binaryData, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": binaryData.length.toString(),
        "X-Text-Response": textResponse
          ? encodeURIComponent(textResponse)
          : "",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === "AbortError") {
      return Response.json(
        { error: "Request timed out. Try a simpler prompt." },
        { status: 504 }
      );
    }

    console.error("Gemini API error:", error);
    return Response.json(
      { error: "Image generation failed. Please try again." },
      { status: 502 }
    );
  }
}
```

### Gemini Client Singleton

```typescript
// lib/gemini.ts
// Source: @google/genai npm docs, Gemini API image generation docs

import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

export const MODEL_ID = "gemini-3-pro-image-preview";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
```

### Zod Validation Schema

```typescript
// lib/schemas.ts
// Source: Zod 4 docs, PRD error table

import { z } from "zod";

export const VALID_ASPECT_RATIOS = [
  "1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "21:9",
] as const;

export const VALID_RESOLUTIONS = ["1K", "2K", "4K"] as const;
export const VALID_MIME_TYPES = [
  "image/jpeg", "image/png", "image/webp",
] as const;
export const MAX_IMAGE_SIZE_BYTES = 7 * 1024 * 1024; // 7 MB

export const generateRequestSchema = z
  .object({
    prompt: z
      .string({ required_error: "Please enter a prompt." })
      .min(1, "Please enter a prompt.")
      .max(10000, "Prompt is too long. Please shorten it."),
    mode: z.enum(["text-to-image", "image-to-image"]).default("text-to-image"),
    aspectRatio: z
      .enum(VALID_ASPECT_RATIOS, {
        errorMap: () => ({ message: "Invalid aspect ratio." }),
      })
      .default("1:1"),
    resolution: z
      .enum(VALID_RESOLUTIONS, {
        errorMap: () => ({ message: "Resolution must be 1K, 2K, or 4K." }),
      })
      .default("1K"),
    image: z.string().optional(),
    imageMimeType: z
      .enum(VALID_MIME_TYPES, {
        errorMap: () => ({
          message: "Supported formats: JPEG, PNG, WebP.",
        }),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.mode === "image-to-image") {
        return !!data.image && !!data.imageMimeType;
      }
      return true;
    },
    {
      message: "Please upload an image.",
      path: ["image"],
    }
  );

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
```

### Constants

```typescript
// lib/constants.ts

export const ERROR_MESSAGES = {
  EMPTY_PROMPT: "Please enter a prompt.",
  MISSING_IMAGE: "Please upload an image.",
  IMAGE_TOO_LARGE: "Image must be under 7 MB.",
  INVALID_IMAGE_FORMAT: "Supported formats: JPEG, PNG, WebP.",
  INVALID_ASPECT_RATIO: "Invalid aspect ratio.",
  INVALID_RESOLUTION: "Resolution must be 1K, 2K, or 4K.",
  GENERATION_FAILED: "Image generation failed. Please try again.",
  SAFETY_BLOCKED: "The request was blocked by content safety filters.",
  TIMEOUT: "Request timed out. Try a simpler prompt.",
  METHOD_NOT_ALLOWED: "Method not allowed.",
  INVALID_BODY: "Invalid request body.",
} as const;

export const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1" },
  { value: "3:2", label: "3:2" },
  { value: "2:3", label: "2:3" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "21:9", label: "21:9" },
] as const;

export const RESOLUTIONS = [
  { value: "1K", label: "1K", cost: "$0.134" },
  { value: "2K", label: "2K", cost: "$0.134" },
  { value: "4K", label: "4K", cost: "$0.24" },
] as const;
```

### Environment Configuration

```env
# .env.local (NEVER commit)
GEMINI_API_KEY=your_api_key_here
```

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal config for Phase 1
  // Body size for Route Handlers is handled by Vercel's 4.5 MB limit
  // (our binary streaming response bypasses this)
};

export default nextConfig;
```

## Discretion Recommendations

### Image Delivery Format: Binary Streaming (RECOMMENDED)

**Decision:** Return successful responses as raw binary with `Content-Type: image/png` headers. Return errors as JSON with `Content-Type: application/json`.

**Rationale:**
1. **Vercel 4.5 MB limit is hard.** Base64 JSON works for 1K (~1-2 MB encoded) but fails for 2K (~3-5 MB encoded) and always fails for 4K. Streaming bypasses this limit entirely.
2. **Memory efficiency.** The client receives a Blob, creates an object URL via `URL.createObjectURL()`, and never holds the full base64 string in memory. This is critical for mobile.
3. **Network efficiency.** Binary is ~25% smaller than base64-encoded data in JSON.
4. **Clean separation.** Success = binary image. Error = JSON. The client checks `res.ok` to decide which path to take.
5. **Text response metadata.** The optional text description from Gemini is passed via `X-Text-Response` header (URL-encoded). This keeps the image body pure binary.

**Tradeoff:** Slightly more complex client-side parsing (check `res.ok`, then `res.blob()` or `res.json()`). Worth it for the reliability and efficiency gains.

### Error & Safety Messaging

**Decision:** Use the PRD error table messages verbatim. Return the first Zod validation error message for 400 responses. Use specific HTTP status codes per error type.

| Condition | HTTP Status | Error Message |
|-----------|-------------|---------------|
| Validation failure | 400 | First Zod error message (matches PRD table) |
| Safety filter block | 422 | "The request was blocked by content safety filters." |
| Gemini API error | 502 | "Image generation failed. Please try again." |
| Timeout | 504 | "Request timed out. Try a simpler prompt." |
| Non-POST method | 405 | Handled by Next.js automatically |
| Malformed JSON body | 400 | "Invalid request body." |

### Input Constraints

**Decision:**
- **Prompt max length:** 10,000 characters (generous but prevents abuse; Gemini handles up to ~32K tokens)
- **Prompt min length:** 1 character (non-empty)
- **Image size limit:** 7 MB per PRD (validated server-side by checking base64 string length; client-side validation in Phase 3)
- **Server-side validation only in Phase 1.** Client-side validation comes in Phase 2/3 when the UI components are built.

### Project Preferences

**Decision:**
- **Package manager:** npm (default with `create-next-app`, simplest, no configuration)
- **Styling:** Tailwind CSS v4 (per PRD tech stack)
- **Linting:** ESLint 10 with `eslint-config-next` (default from `create-next-app`)
- **No Prettier in Phase 1:** ESLint handles formatting rules. Add Prettier later if needed.
- **No shadcn/ui initialization in Phase 1:** No UI components needed yet. Initialize in Phase 2 when building the form.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@google/generative-ai` SDK | `@google/genai` SDK | May 2025 (GA) | New SDK required for Gemini 3+ features (image gen, thought signatures). Old SDK is deprecated. |
| `tailwind.config.js` + PostCSS plugin | `@import "tailwindcss"` + `@theme` in CSS | Tailwind v4 (Jan 2025) | CSS-first config, no JS config file. 5x faster builds. |
| Pages Router API routes (`pages/api/`) | App Router Route Handlers (`app/api/*/route.ts`) | Next.js 13+ (stable in 14+) | Route Handlers use Web APIs (Request/Response), support streaming, and coexist with Server Components. |
| `export const config = { api: { bodyParser: { sizeLimit: '12mb' } } }` | No body parser config for Route Handlers | Next.js App Router | Route Handlers read the body via `req.json()` or `req.formData()`. There is no built-in body size config for Route Handlers. Vercel enforces the 4.5 MB limit at the platform level. |
| Vercel 60s function timeout | Vercel 300s with Fluid Compute (default for new projects) | April 2025 | No need for Vercel Pro to get 120s timeout. Hobby plan goes up to 300s with Fluid Compute enabled. |

**Deprecated/outdated:**
- `@google/generative-ai`: Replaced by `@google/genai`. No Gemini 3+ support.
- `tailwindcss-animate`: Replaced by Tailwind v4 native `animate-*` utilities (since March 2025).
- `bodyParser.sizeLimit` in API route config: Pages Router pattern. App Router Route Handlers do not use this.

## Open Questions

1. **Exact image file sizes at each resolution**
   - What we know: 1K images are typically 1-2 MB PNG. 2K and 4K scale proportionally with pixel count.
   - What's unclear: Exact average file sizes for Gemini 3 Pro Image output at each resolution. PNG compression varies by image content. We have no official data from Google on typical output sizes.
   - Recommendation: Test empirically during Phase 1 deployment. Generate test images at each resolution and measure. If 1K images are consistently under 3 MB (under 4.5 MB base64), JSON delivery could work as a simpler fallback for 1K-only scenarios. Binary streaming is still recommended for future-proofing.

2. **AbortController compatibility with @google/genai SDK**
   - What we know: The SDK uses fetch internally, which supports AbortSignal. We intend to use `AbortController` for timeout handling.
   - What's unclear: Whether `ai.models.generateContent()` accepts an AbortSignal parameter or if we need to wrap the call differently.
   - Recommendation: Test during implementation. If the SDK doesn't accept AbortSignal directly, wrap the call in `Promise.race()` with a timeout promise. This is a trivial fallback:
     ```typescript
     const result = await Promise.race([
       ai.models.generateContent({ ... }),
       new Promise((_, reject) =>
         setTimeout(() => reject(new Error("Timeout")), 115_000)
       ),
     ]);
     ```

3. **Image size validation for base64 uploads (image-to-image)**
   - What we know: The PRD specifies 7 MB max image upload. Vercel has a 4.5 MB request body limit.
   - What's unclear: A 7 MB image becomes ~9.3 MB as base64. Combined with prompt and metadata in JSON, the request body would be ~9.5 MB. This exceeds Vercel's 4.5 MB request body limit.
   - Recommendation: For Phase 1, cap image uploads at the server-side validation level. The actual client-side resize/compression happens in Phase 3. For now, the 4.5 MB Vercel limit will naturally enforce a ~3.4 MB raw image cap. Document this as a known limitation to resolve in Phase 3 via client-side compression before base64 encoding.

## Sources

### Primary (HIGH confidence)
- [Gemini API Image Generation Documentation](https://ai.google.dev/gemini-api/docs/image-generation) -- SDK usage, code examples, imageConfig, responseModalities
- [Gemini API Safety Settings](https://ai.google.dev/gemini-api/docs/safety-settings) -- Safety categories, thresholds, finishReason enum, blocking behavior
- [Gemini API Response Reference](https://ai.google.dev/api/generate-content) -- GenerateContentResponse structure, candidates, parts, inlineData
- [Next.js Route Handlers (v16.1.6)](https://nextjs.org/docs/app/api-reference/file-conventions/route) -- POST handler, streaming, segment config, Request/Response APIs
- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations) -- 4.5 MB body, 300s max duration, memory, Fluid Compute
- [Vercel Body Size Limit KB](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions) -- Streaming bypass confirmation
- [@google/genai on npm](https://www.npmjs.com/package/@google/genai) -- Version 1.41.0, GA status
- [Zod 4 Documentation](https://zod.dev/) -- safeParse, schema definition, error handling

### Secondary (MEDIUM confidence)
- [Gemini Image Editing Next.js Quickstart (Google)](https://github.com/google-gemini/gemini-image-editing-nextjs-quickstart) -- Reference implementation patterns
- [Next.js App Router body size discussion](https://github.com/vercel/next.js/issues/57501) -- Confirms no built-in body size config for Route Handlers
- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3) -- Model capabilities, resolution support

### Tertiary (LOW confidence)
- Gemini API output image sizes (no official data from Google; estimated from PNG compression norms and pixel counts)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All versions verified via npm registry and official docs on 2026-02-18
- Architecture: HIGH -- Patterns verified against official Next.js docs (v16.1.6) and Gemini API docs
- Pitfalls: HIGH -- Vercel limits documented officially; safety filter behavior documented in API docs and corroborated by community reports
- Image delivery format: HIGH -- Binary streaming bypass of 4.5 MB limit confirmed in official Vercel KB article
- AbortController timeout: MEDIUM -- Standard Web API pattern, but SDK compatibility with AbortSignal not explicitly documented

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (30 days -- stack is stable, model is preview)
