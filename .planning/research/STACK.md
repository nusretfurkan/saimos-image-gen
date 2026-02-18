# Stack Research

**Domain:** Personal AI image generation web tool (Google Gemini wrapper)
**Researched:** 2026-02-18
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Next.js (App Router) | 16.1.x | Full-stack React framework | Vercel-native deployment. App Router provides server-side Route Handlers that keep the Gemini API key off the client. Turbopack is now the stable default bundler with 5-10x faster Fast Refresh. Next.js 16 is the current stable major. | HIGH |
| React | 19.x | UI library | Ships with Next.js 16. React 19 brings Server Components and Server Actions as stable primitives, both useful for proxying Gemini calls without exposing secrets. | HIGH |
| TypeScript | 5.9.x | Type safety | Current stable release. TS 6.0 is in beta but not production-ready. TS 5.9 is the safe choice; Next.js 16 ships typed by default with `create-next-app --ts`. Do NOT jump to TS 6.0 beta or TS 7.0 preview. | HIGH |
| Tailwind CSS | 4.1.x | Utility-first styling | v4 is a ground-up rewrite: CSS-first config (no `tailwind.config.js`), `@import "tailwindcss"` one-liner, 5x faster full builds, 100x faster incremental. The `@theme` directive replaces the old config file. shadcn/ui fully supports v4. | HIGH |
| @google/genai | 1.x (latest 1.41.0) | Gemini API client | Official Google GenAI SDK, GA since May 2025. Provides `ai.models.generateContent()` with native image generation support. Handles thought signatures automatically for conversational editing -- critical for multi-turn image editing with Gemini 3 Pro. Replaces the older `@google/generative-ai` package. | HIGH |

### AI Model

| Model | ID | Purpose | Why Recommended | Confidence |
|-------|-----|---------|-----------------|------------|
| Gemini 3 Pro Image | `gemini-3-pro-image-preview` | Text-to-image and image-to-image | Google's highest-quality image generation model. Supports 4K resolution, 10 aspect ratios, multi-turn conversational editing, up to 14 reference images, and high-fidelity text rendering. The SDK handles thought signatures that preserve visual context between editing turns. Currently in preview. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| zod | 4.x (latest 4.3.6) | Schema validation | Validate all user input (prompts, image configs, aspect ratios) before sending to Gemini API. Use in Route Handlers to reject malformed requests early. | HIGH |
| sonner | 2.x (latest 2.0.7) | Toast notifications | User feedback for generation status, errors, and completion. Lightweight, accessible, zero-config. shadcn/ui recommends sonner over its deprecated toast component. | HIGH |
| lucide-react | 0.574.x | Icon set | Consistent, tree-shakable SVG icons. De facto standard for shadcn/ui projects. | HIGH |
| clsx | 2.x (latest 2.1.1) | Conditional class names | Compose Tailwind classes conditionally. Tiny (228B) with no dependencies. | HIGH |
| tailwind-merge | 3.x (latest 3.4.1) | Merge Tailwind classes | Resolve conflicting Tailwind classes when composing component variants. Used alongside clsx in the `cn()` utility pattern. | HIGH |

### Development Tools

| Tool | Purpose | Notes | Confidence |
|------|---------|-------|------------|
| ESLint | 10.x | Linting | ESLint 10 is current stable. Next.js 16 includes `eslint-config-next` out of the box. | HIGH |
| @types/react | 19.x | React type definitions | Matches React 19. Installed automatically by `create-next-app`. | HIGH |
| @types/node | 22.x+ | Node.js type definitions | Match the Node.js version Vercel runs (Node 22 LTS). | MEDIUM |

## Installation

```bash
# Scaffold the project
npx create-next-app@latest saimos-image-gen --ts --tailwind --app --eslint --src-dir --import-alias "@/*"

# Core AI dependency
npm install @google/genai

# Validation
npm install zod

# UI utilities
npm install clsx tailwind-merge lucide-react sonner

# shadcn/ui (interactive CLI -- run after project scaffold)
npx shadcn@latest init
```

## Configuration

### Environment Variable

```env
# .env.local (NEVER commit this file)
GEMINI_API_KEY=your_api_key_here
```

### Vercel Function Duration

```typescript
// app/api/generate/route.ts
export const maxDuration = 300; // seconds (Hobby plan max with Fluid Compute)
```

### Tailwind CSS v4

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Custom design tokens go here */
}
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @google/genai | @google/generative-ai | Never. This is the legacy package. Google deprecated it in favor of @google/genai which has GA status and supports image generation natively. |
| @google/genai | Vercel AI SDK (@ai-sdk/google) | Only if you need streaming text with built-in React hooks. For image generation, the AI SDK adds an abstraction layer with no benefit -- Gemini image generation returns a complete response, not a stream. Go direct. |
| Tailwind CSS v4 | Tailwind CSS v3 | Only if using a UI library that hasn't migrated to v4 yet. shadcn/ui supports v4, so no reason to stay on v3 for this project. |
| zod | yup / joi | Never for this stack. Zod is TypeScript-native with zero dependencies, integrates with Server Actions, and is the de facto standard for Next.js validation. |
| sonner | react-hot-toast | Only if you need more customization of toast layout. Sonner is simpler, more accessible, and actively maintained. |
| No auth | NextAuth.js | Only if the tool becomes multi-user. For a personal tool, auth adds complexity with zero value. |
| No database | Drizzle / Prisma | Only if you add persistence (history, favorites). The project spec explicitly says zero persistence. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@google/generative-ai` | Legacy SDK. Google's official recommendation is `@google/genai` which is GA, actively maintained, and handles image generation features (thought signatures, inline data) that the old SDK lacks. | `@google/genai` |
| Vercel AI SDK for image generation | Adds unnecessary abstraction. `generateImage()` in the AI SDK is a wrapper that limits control over Gemini-specific config (aspect ratios, resolution, thought signatures). You lose access to conversational editing features. | `@google/genai` directly |
| Pages Router (`pages/`) | Legacy routing in Next.js. App Router is the default and future. Pages Router lacks Server Components, streaming, and the Route Handler pattern needed for server-side API proxying. | App Router (`app/`) |
| Tailwind CSS v3 | v4 is stable, faster, and uses CSS-first config. v3 requires a JS config file and PostCSS plugin. v4 is a drop-in for new projects. No reason to start a new project on v3. | Tailwind CSS v4 |
| `tailwindcss-animate` | Deprecated by shadcn/ui as of March 2025. Tailwind v4 includes built-in animation utilities. | Tailwind v4 native `animate-*` utilities |
| react-dropzone | Unnecessary dependency for this project. The HTML5 `<input type="file" accept="image/*">` with a styled Tailwind wrapper is sufficient. react-dropzone adds 14KB for drag-and-drop that mobile users won't use (this is a mobile-first app). | Native file input with `accept="image/*"` and a `capture` attribute for mobile |
| browser-image-compression | Premature optimization. Gemini accepts base64-encoded images directly. Client-side compression risks degrading image quality before the AI model processes it. Only add if you hit the 4.5 MB Vercel function body size limit. | Send images directly; compress only if body size becomes an issue |
| TypeScript 6.0 beta / 7.0 preview | Both are pre-release. TS 6.0 is in beta (Feb 2026). TS 7.0 is a Go-based rewrite still in preview. Neither is production-ready. | TypeScript 5.9.x |
| CSS Modules / styled-components | Tailwind v4 covers all styling needs. CSS Modules add file proliferation. styled-components adds runtime overhead and bundle size. | Tailwind CSS v4 |

## Stack Patterns by Variant

**If the Gemini API response exceeds 4.5 MB (e.g., 4K images):**
- Return the image as a base64 data URL directly in the JSON response body
- If the response body hits the 4.5 MB Vercel limit, switch to streaming the response using `ReadableStream` in the Route Handler
- Because Vercel's 4.5 MB limit applies to the response body, 4K images (~3-5 MB base64-encoded) may push this boundary

**If you need multi-turn conversational editing:**
- Store thought signatures in React state between turns
- Send the previous `thoughtSignature` back to the API on each editing request
- The `@google/genai` SDK handles this automatically when you pass the conversation history

**If generation times exceed 60 seconds:**
- Vercel Hobby plan with Fluid Compute allows up to 300 seconds
- Set `export const maxDuration = 300;` in the Route Handler
- Fluid Compute is enabled by default for new Vercel projects (since April 2025)

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| next@16.1.x | react@19.x, react-dom@19.x | Next.js 16 requires React 19. Do not mix with React 18. |
| next@16.1.x | typescript@5.7+ | Officially supports TS 5.7 through 5.9. |
| tailwindcss@4.1.x | next@16.x | Works out of the box with `create-next-app`. No PostCSS config needed; v4 uses its own built-in engine. |
| @google/genai@1.x | node@18+ | Requires Node.js 18 or later. Vercel runs Node 22 LTS by default. |
| shadcn/ui (latest) | tailwindcss@4.x, react@19.x | Full Tailwind v4 + React 19 support since early 2025. CLI generates v4-compatible components. |
| zod@4.x | typescript@5.7+ | Zod 4 requires TS 5.7+. Compatible with TS 5.9. |

## Vercel Platform Constraints

| Constraint | Hobby Plan Value | Impact on Project |
|------------|------------------|-------------------|
| Function max duration | 300s (with Fluid Compute) | Sufficient for Gemini image generation (typically 10-60s). Set `maxDuration = 300` as safety margin. |
| Request body size | 4.5 MB | User-uploaded images for editing must stay under 4.5 MB. Resize on client if needed. |
| Response body size | 4.5 MB | 4K images may approach this limit when base64-encoded. Monitor and fall back to streaming if needed. |
| Memory | 2 GB / 1 vCPU | Adequate for proxying API calls. No heavy server-side image processing. |
| Deployments | Unlimited | No concern. |
| Bandwidth | 1 TB/month | Generous for a personal tool. |

## Sources

- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) -- Next.js 16 release details, Turbopack stability
- [Next.js 16.1 Blog Post](https://nextjs.org/blog/next-16-1) -- Latest minor release details
- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3) -- Gemini 3 Pro Image model capabilities
- [Gemini Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation) -- SDK usage patterns, code examples
- [Gemini Models List](https://ai.google.dev/gemini-api/docs/models) -- Model IDs, token limits, capabilities
- [Gemini 3 Pro Image (Vertex AI)](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-pro-image) -- Aspect ratios, resolution options, thought signatures
- [@google/genai on npm](https://www.npmjs.com/package/@google/genai) -- Version 1.41.0, GA status
- [Tailwind CSS v4.0 Blog Post](https://tailwindcss.com/blog/tailwindcss-v4) -- v4 architecture, CSS-first config
- [Tailwind CSS v4.1 Blog Post](https://tailwindcss.com/blog/tailwindcss-v4-1) -- Latest features, browser compatibility
- [shadcn/ui Tailwind v4 Docs](https://ui.shadcn.com/docs/tailwind-v4) -- Tailwind v4 compatibility, deprecated tailwindcss-animate
- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations) -- Duration, body size, memory limits
- [Vercel Fluid Compute Changelog](https://vercel.com/changelog/higher-defaults-and-limits-for-vercel-functions-running-fluid-compute) -- Default enablement for new projects
- npm registry (verified via `npm view` on 2026-02-18) -- All package versions confirmed current

---
*Stack research for: Saimos Image Gen -- Personal AI image generation tool wrapping Google Gemini*
*Researched: 2026-02-18*
