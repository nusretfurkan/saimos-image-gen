# Phase 2: Text-to-Image Generation - Research

**Researched:** 2026-02-18
**Domain:** Client-side generation UI (prompt input, filter controls, image display, loading/error states)
**Confidence:** HIGH

## Summary

Phase 2 builds the core generation loop on top of Phase 1's API route: user types a prompt, selects aspect ratio and resolution, hits Generate, and sees the result displayed as the hero element. The domain is entirely client-side React components wired to the existing `/api/generate` endpoint.

The key technical decisions are: (1) how to deliver images from the API route to the client without hitting Vercel's 4.5 MB body size limit (binary streaming, not JSON-wrapped base64), (2) how to implement the auto-expanding textarea (CSS `field-sizing: content` with a JS fallback, or `react-textarea-autosize`), (3) how to achieve the crossfade image reveal (CSS opacity transitions on stacked absolute-positioned images), and (4) how to build horizontally scrollable aspect ratio pills on mobile (Tailwind `overflow-x-auto` with scrollbar-hide utility).

All decisions have clear, well-documented patterns with no ambiguity. The component count is small (3-4 new components), state management is simple (`useState` hooks in the page component), and the API integration is a single `fetch` call. The main risk is the Vercel 4.5 MB response body limit for 2K/4K images, which Phase 1's API route design should address.

**Primary recommendation:** Build three focused components (PromptInput, FilterControls, ResultDisplay) orchestrated by a single client page component. Use binary streaming from the API route for image delivery. Use CSS-only patterns for the crossfade reveal and scrollable pills. Add `react-textarea-autosize` only if CSS `field-sizing` proves insufficient during implementation.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

User delegated all implementation decisions to Claude's optimization. The following areas are flexible -- Claude chooses the best approach during planning and implementation.

**Prompt input design**
- Auto-expanding textarea that grows with content (min ~2 lines, max ~6 lines)
- Helpful placeholder text guiding the user (e.g., "Describe the image you want to create...")
- Cmd/Ctrl+Enter as keyboard shortcut to submit (button is primary submit method)
- No character limit display -- keep it clean
- Generate button disabled when textarea is empty

**Aspect ratio selector**
- Visual pill buttons showing ratio shape indicators (small rectangles reflecting the ratio)
- Horizontally scrollable row on mobile to fit all 8 options compactly
- Compact grid or wrapped row on desktop where space allows
- 1:1 selected by default, clearly highlighted
- Each pill shows the ratio text (e.g., "16:9") with a small shape preview

**Image reveal experience**
- Output area completely hidden before first generation (no placeholder, no empty box)
- Smooth fade-in transition when image first appears
- On regeneration: previous image stays visible during loading, crossfades to new result
- Spinner overlays the previous image during regeneration (not replacing it with blank)

**Cost & warning display**
- Subtle muted text under or beside resolution pills showing per-image cost (e.g., "$0.13" / "$0.24")
- When 4K is selected, an inline note appears: "4K may take longer (up to 2 min)"
- Cost text uses smaller, secondary typography -- informative but not alarming
- No modal or toast -- everything inline and non-disruptive

### Claude's Discretion

All implementation details are delegated to Claude. Research investigates options and recommends the best approach.

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GEN-01 | User can enter a text prompt and generate an image (text-to-image) | Auto-expanding textarea pattern, Cmd/Ctrl+Enter shortcut, `fetch` to `/api/generate`, AbortController for request lifecycle |
| FILT-01 | User can select aspect ratio from 8 options (1:1, 3:2, 2:3, 4:3, 3:4, 16:9, 9:16, 21:9) | Pill button selector with shape indicators, horizontally scrollable on mobile via `overflow-x-auto` with scrollbar-hide |
| FILT-02 | User can select resolution (1K, 2K, 4K) | Pill button selector, values passed to API as uppercase strings per Gemini requirement |
| FILT-03 | User can see per-image cost indicator next to resolution options | Static text labels: "$0.13" for 1K/2K, "$0.24" for 4K, inline below resolution pills |
| OUT-01 | Generated image displays prominently as the hero element | Binary image delivery via streaming response, `URL.createObjectURL()` for memory-efficient display, CSS crossfade transition |
| UX-01 | Loading state with spinner and "Generating..." text during generation | Overlay spinner on previous image during regeneration, disable Generate button, AbortController to prevent duplicate requests |
| UX-04 | Only the last generated image is held -- no persistence across page refreshes | Single `useState` for current image blob URL, revoke previous object URL on new generation |
| UX-06 | 4K resolution option shows timeout warning for free tier | Inline note below resolution pills when 4K selected: "4K may take longer (up to 2 min)" |
| UX-07 | Error states handled with inline messages and retry option | Inline error banner below output area with specific messages per error type + "Try Again" button |

</phase_requirements>

## Standard Stack

### Core (Already Established in Phase 1)

| Library | Version | Purpose | Phase 2 Usage |
|---------|---------|---------|---------------|
| Next.js (App Router) | 16.1.x | Framework | `app/page.tsx` as the single client page orchestrating all components |
| React | 19.x | UI library | `useState` for all state (prompt, filters, image, loading, error), `useCallback` for event handlers |
| TypeScript | 5.9.x | Type safety | Interfaces for API request/response, filter option types, component props |
| Tailwind CSS | 4.1.x | Styling | All component styling, responsive breakpoints, transitions, scrollbar-hide |

### New for Phase 2

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-textarea-autosize | 8.5.x | Auto-expanding textarea | **Conditional**: Use only if CSS `field-sizing: content` has insufficient browser support at implementation time. The CSS approach is preferred (zero-dependency). |

### NOT Needed

| Library | Why Not |
|---------|---------|
| framer-motion | Overkill for a single crossfade transition. CSS `opacity` + `transition` handles the image reveal. |
| react-spring | Same as above. The crossfade pattern is achievable with pure CSS. |
| react-transition-group | Legacy animation library. CSS transitions are sufficient. |
| react-hot-toast / sonner | Error messages are inline, not toasts. Phase context explicitly says "No modal or toast." |
| any carousel/slider library | Aspect ratio pills are a simple flex row with overflow scroll, not a carousel. |

**Installation:**
```bash
# Likely no new packages needed for Phase 2.
# If CSS field-sizing proves insufficient:
npm install react-textarea-autosize
```

## Architecture Patterns

### Recommended Component Structure

```
src/
├── app/
│   ├── page.tsx              # "use client" — orchestrates all state and fetch logic
│   └── api/generate/route.ts # (Phase 1 — already exists)
├── components/
│   ├── prompt-input.tsx      # Auto-expanding textarea + Generate button
│   ├── filter-controls.tsx   # Aspect ratio pills + resolution pills + cost/warning
│   ├── result-display.tsx    # Image output with crossfade, loading overlay, error state
│   └── ui/                   # (Phase 1 — shared primitives)
├── lib/
│   ├── types.ts              # (Phase 1 — add GenerateRequest, GenerateResponse types)
│   ├── constants.ts          # (Phase 1 — add ASPECT_RATIOS, RESOLUTIONS, COSTS)
│   └── utils.ts              # (Phase 1 — add cn() if not already there)
```

### Pattern 1: Page Component as State Orchestrator

**What:** The page component owns all state and passes data/callbacks down to child components. No state management library needed.

**When to use:** Small apps with < 10 state variables and a single data flow (prompt -> API -> display).

**Example:**
```typescript
// app/page.tsx
"use client";

import { useState, useCallback, useRef } from "react";
import { PromptInput } from "@/components/prompt-input";
import { FilterControls } from "@/components/filter-controls";
import { ResultDisplay } from "@/components/result-display";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1K");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(async () => {
    // Abort any in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          resolution,
          mode: "text-to-image",
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed.");
      }

      // Binary response: convert to blob URL
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Revoke previous URL to free memory
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(url);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, aspectRatio, resolution, imageUrl]);

  return (
    <main>
      <PromptInput
        value={prompt}
        onChange={setPrompt}
        onSubmit={handleGenerate}
        isLoading={isLoading}
      />
      <FilterControls
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        resolution={resolution}
        onResolutionChange={setResolution}
      />
      <ResultDisplay
        imageUrl={imageUrl}
        isLoading={isLoading}
        error={error}
        onRetry={handleGenerate}
      />
    </main>
  );
}
```

### Pattern 2: Binary Image Delivery (Streaming)

**What:** The API route returns the generated image as raw binary (PNG bytes) with `Content-Type: image/png` instead of wrapping it in JSON. The client receives it as a `Blob` and creates an object URL for display. This bypasses Vercel's 4.5 MB JSON response body limit.

**When to use:** Always for image delivery. Especially critical for 2K/4K images.

**Why:** A 2K PNG image is typically 2-4 MB. Base64-encoded in JSON, that becomes 3-5.3 MB, which approaches or exceeds Vercel's 4.5 MB limit. Binary streaming has no such constraint.

**Server-side example:**
```typescript
// app/api/generate/route.ts (Phase 1 should implement this pattern)
// Extract image data from Gemini response
const imagePart = response.candidates?.[0]?.content?.parts?.find(
  (part) => part.inlineData
);

if (!imagePart?.inlineData) {
  return NextResponse.json(
    { error: "No image was generated. Try rephrasing your prompt." },
    { status: 422 }
  );
}

const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
return new Response(imageBuffer, {
  headers: {
    "Content-Type": imagePart.inlineData.mimeType || "image/png",
    "Cache-Control": "no-store",
  },
});
```

**Client-side example:**
```typescript
// Receiving binary image
const res = await fetch("/api/generate", { ... });

if (!res.ok) {
  // Error responses are still JSON
  const data = await res.json();
  throw new Error(data.error);
}

// Success response is binary image
const blob = await res.blob();
const url = URL.createObjectURL(blob);
// Use url as <img src={url} />
```

**Memory management:**
```typescript
// Always revoke previous object URL before setting new one
if (previousUrl) URL.revokeObjectURL(previousUrl);
setImageUrl(newUrl);
```

### Pattern 3: Auto-Expanding Textarea

**What:** Textarea that grows from ~2 lines to ~6 lines as the user types, without a visible scrollbar in the growth range.

**Option A: CSS `field-sizing: content` (preferred, zero-dependency)**
```css
textarea {
  field-sizing: content;
  min-height: 3.5rem;  /* ~2 lines */
  max-height: 10rem;   /* ~6 lines */
}
```
- Browser support: Chrome 119+, Edge 119+. Firefox and Safari lack support (as of Feb 2026).
- For unsupported browsers, the textarea degrades to a fixed-height scrollable textarea -- functional but not ideal.

**Option B: `react-textarea-autosize` (reliable cross-browser)**
```typescript
import TextareaAutosize from "react-textarea-autosize";

<TextareaAutosize
  minRows={2}
  maxRows={6}
  value={prompt}
  onChange={(e) => setPrompt(e.target.value)}
  placeholder="Describe the image you want to create..."
  className="w-full resize-none ..."
/>
```
- 1.3 KB gzipped. Drop-in `<textarea>` replacement.
- Works in all browsers. Actively maintained.
- minRows/maxRows map directly to user requirement (~2 lines min, ~6 lines max).

**Recommendation:** Use `react-textarea-autosize`. Safari is a first-class mobile browser for this mobile-first app, and `field-sizing` lacks Safari support. The 1.3 KB cost is negligible.

### Pattern 4: CSS Crossfade Image Reveal

**What:** First generation: image fades in from hidden. Regeneration: spinner overlays previous image, new image crossfades in.

**Implementation:**
```tsx
// result-display.tsx
<div className="relative">
  {/* Previous image stays visible during loading */}
  {previousImageUrl && (
    <img
      src={previousImageUrl}
      alt="Previous generation"
      className={`absolute inset-0 w-full h-auto transition-opacity duration-500
        ${imageUrl !== previousImageUrl ? "opacity-0" : "opacity-100"}`}
    />
  )}

  {/* Current/new image fades in */}
  {imageUrl && (
    <img
      src={imageUrl}
      alt="Generated image"
      className="w-full h-auto transition-opacity duration-500"
      style={{ opacity: isLoading ? 0 : 1 }}
      onLoad={() => {
        // After new image loads, revoke previous URL
        if (previousImageUrl && previousImageUrl !== imageUrl) {
          URL.revokeObjectURL(previousImageUrl);
        }
      }}
    />
  )}

  {/* Loading overlay on top of previous image */}
  {isLoading && imageUrl && (
    <div className="absolute inset-0 flex items-center justify-center
      bg-black/30 backdrop-blur-sm rounded-lg">
      <div className="flex flex-col items-center gap-2">
        <Spinner />
        <span className="text-white text-sm">Generating...</span>
      </div>
    </div>
  )}
</div>
```

**Key points:**
- Two `<img>` elements stacked with `position: absolute` for the previous image
- CSS `transition: opacity 500ms` for smooth crossfade
- `onLoad` event on the new image triggers cleanup of the previous object URL
- Loading overlay uses `backdrop-blur-sm` for a subtle frosted glass effect over the previous image

### Pattern 5: Horizontally Scrollable Pill Selector (Mobile)

**What:** 8 aspect ratio pills in a horizontally scrollable row on mobile, wrapped row or compact grid on desktop.

```tsx
// Scrollbar-hide utility in globals.css (Tailwind v4)
@utility scrollbar-hide {
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

// Component
<div className="flex gap-2 overflow-x-auto scrollbar-hide
  md:flex-wrap md:overflow-x-visible">
  {ASPECT_RATIOS.map((ratio) => (
    <button
      key={ratio.value}
      onClick={() => onAspectRatioChange(ratio.value)}
      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5
        rounded-full border text-sm transition-colors
        ${aspectRatio === ratio.value
          ? "border-green-600 bg-green-50 text-green-800"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
        }`}
    >
      {/* Shape indicator: small rectangle reflecting the ratio */}
      <span
        className="inline-block border border-current rounded-sm"
        style={{
          width: `${12 * ratio.widthFactor}px`,
          height: `${12 * ratio.heightFactor}px`,
        }}
      />
      {ratio.label}
    </button>
  ))}
</div>
```

**Desktop adaptation:** `md:flex-wrap md:overflow-x-visible` allows pills to wrap into multiple rows on wider viewports instead of scrolling.

### Anti-Patterns to Avoid

- **Setting image `src` directly to base64 data URL strings:** Holds the entire base64 string in JavaScript memory alongside the decoded image. Use `URL.createObjectURL()` with blobs instead.
- **No AbortController on the fetch call:** Without it, rapid-fire "Generate" clicks queue multiple expensive API calls. Always abort the previous request before starting a new one.
- **Using `useEffect` to trigger generation:** Generation is a user action (click/keyboard), not a side effect. Wire it to `onClick`/`onSubmit` handlers directly.
- **Hiding the output area with `display: none` during loading:** Causes layout shift. Instead, keep the container visible and overlay the spinner.
- **Using a modal/toast for errors:** Context explicitly says inline errors only. No modals, no toasts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auto-expanding textarea | Custom `scrollHeight` resize logic with `useEffect` + `useRef` | `react-textarea-autosize` or CSS `field-sizing: content` | Resize calculations are tricky across browsers, especially with line-height, padding, and border-box. The library handles edge cases (paste, programmatic changes, SSR). |
| Scrollbar hiding | Custom CSS overrides scattered in components | Tailwind `@utility scrollbar-hide` defined once in globals.css | Requires both `-webkit-scrollbar` (Chrome/Safari) and `scrollbar-width: none` (Firefox). Centralizing ensures consistency. |
| AbortController cleanup | Manual `useEffect` cleanup with refs | Inline `abortControllerRef` in the handler callback | The generation is triggered by user action, not a mount/unmount cycle. A ref-based controller in the callback is cleaner than an effect. |
| Aspect ratio shape preview | SVG icons for each ratio | Inline `<span>` with computed width/height from ratio factors | 8 SVGs is unnecessary maintenance. A styled `<span>` with `width: 12 * widthFactor` and `height: 12 * heightFactor` computes the shape from the ratio values directly. |

**Key insight:** Phase 2 is almost entirely achievable with zero new dependencies. The only library to potentially add is `react-textarea-autosize` (1.3 KB), and even that is optional if Safari support for `field-sizing` lands before implementation.

## Common Pitfalls

### Pitfall 1: Vercel 4.5 MB Response Body Limit Kills 2K/4K Image Delivery

**What goes wrong:** API route returns base64 image wrapped in JSON. A 2K image (2-4 MB raw) becomes 3-5.3 MB base64-encoded in a JSON envelope. Vercel returns 413 `FUNCTION_PAYLOAD_TOO_LARGE`.

**Why it happens:** Works locally (no size limits), fails on Vercel. Developers don't account for 33% base64 inflation.

**How to avoid:** Phase 1's API route MUST return binary image data with `Content-Type: image/png`, not JSON-wrapped base64. If Phase 1 uses JSON, Phase 2 must refactor the route before building the client.

**Warning signs:** 1K images work, 2K/4K fail on Vercel deployment.

### Pitfall 2: Memory Leak from Unreleased Object URLs

**What goes wrong:** Each `URL.createObjectURL(blob)` allocates browser memory. If old URLs are not revoked with `URL.revokeObjectURL()`, memory accumulates across generations, eventually causing mobile browser crashes.

**Why it happens:** Developers set a new image URL without cleaning up the previous one. GC does not automatically release object URLs.

**How to avoid:** Always call `URL.revokeObjectURL(previousUrl)` before setting a new URL. Use the `onLoad` event of the new `<img>` to confirm the new image is rendered before revoking the old one.

**Warning signs:** Mobile tab slows down or crashes after 5+ sequential generations.

### Pitfall 3: Duplicate API Requests from Rapid Generate Clicks

**What goes wrong:** User clicks "Generate" multiple times quickly. Without request cancellation, each click fires an independent `fetch` call to the API route, burning API quota and creating race conditions where old results overwrite new ones.

**Why it happens:** No `AbortController` on the fetch call. No debounce or disabling of the button during loading.

**How to avoid:** (1) Disable the Generate button during loading. (2) Use `AbortController` to abort the previous request before starting a new one. (3) Ignore `AbortError` in the catch block.

**Warning signs:** Multiple "Generating..." spinners, wrong image displayed after rapid clicks, unexpected API billing.

### Pitfall 4: Layout Shift When Image Appears

**What goes wrong:** The output area is completely hidden before the first generation (per requirements). When the image appears, it pushes content below it, causing a jarring layout shift.

**Why it happens:** No space is reserved for the image before it loads.

**How to avoid:** When transitioning from hidden to visible, animate the container's height. After the first image, always keep the container visible (with the spinner overlay pattern for regeneration). The aspect ratio is known before generation, so the container can be sized to the expected ratio.

**Warning signs:** Content jumps when the first image loads. User loses scroll position on mobile.

### Pitfall 5: Keyboard Shortcut (Cmd/Ctrl+Enter) Fires During IME Composition

**What goes wrong:** On mobile keyboards and CJK input methods, pressing Enter during composition (e.g., selecting a kanji) triggers the submit shortcut.

**Why it happens:** The `keydown` event fires during IME composition. Developers don't check `event.isComposing`.

**How to avoid:** Check `event.isComposing === false` before processing the Cmd/Ctrl+Enter shortcut.

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.isComposing) return; // Skip during IME composition
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    onSubmit();
  }
};
```

### Pitfall 6: Error Response Parsed as Blob Instead of JSON

**What goes wrong:** When the API route returns an error (4xx/5xx), the response body is JSON (`{ error: "..." }`). But the client tries to call `res.blob()` expecting binary image data, resulting in a meaningless blob and no error message displayed.

**Why it happens:** The client doesn't check `res.ok` before choosing the parsing strategy.

**How to avoid:** Always check `res.ok` first. If false, parse as JSON to extract the error message. If true, parse as blob for the image.

```typescript
if (!res.ok) {
  const data = await res.json();
  throw new Error(data.error || "Generation failed.");
}
const blob = await res.blob();
```

## Code Examples

### Aspect Ratio Constants with Shape Factors

```typescript
// lib/constants.ts
export const ASPECT_RATIOS = [
  { value: "1:1",  label: "1:1",  widthFactor: 1,    heightFactor: 1 },
  { value: "3:2",  label: "3:2",  widthFactor: 1.5,  heightFactor: 1 },
  { value: "2:3",  label: "2:3",  widthFactor: 1,    heightFactor: 1.5 },
  { value: "4:3",  label: "4:3",  widthFactor: 1.33, heightFactor: 1 },
  { value: "3:4",  label: "3:4",  widthFactor: 1,    heightFactor: 1.33 },
  { value: "16:9", label: "16:9", widthFactor: 1.78, heightFactor: 1 },
  { value: "9:16", label: "9:16", widthFactor: 1,    heightFactor: 1.78 },
  { value: "21:9", label: "21:9", widthFactor: 2.33, heightFactor: 1 },
] as const;

export const RESOLUTIONS = [
  { value: "1K", label: "1K", cost: "$0.13" },
  { value: "2K", label: "2K", cost: "$0.13" },
  { value: "4K", label: "4K", cost: "$0.24" },
] as const;

export type AspectRatio = typeof ASPECT_RATIOS[number]["value"];
export type Resolution = typeof RESOLUTIONS[number]["value"];
```

### Generate Request Interface

```typescript
// lib/types.ts
export interface GenerateRequest {
  prompt: string;
  aspectRatio: string;
  resolution: string;
  mode: "text-to-image";
}

// Error response shape (from API route)
export interface ErrorResponse {
  error: string;
}
```

### PromptInput Component Pattern

```typescript
// components/prompt-input.tsx
"use client";

import TextareaAutosize from "react-textarea-autosize";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function PromptInput({ value, onChange, onSubmit, isLoading }: PromptInputProps) {
  const canSubmit = value.trim().length > 0 && !isLoading;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.isComposing) return;
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <TextareaAutosize
        minRows={2}
        maxRows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe the image you want to create..."
        className="w-full resize-none rounded-xl border border-gray-200
          px-4 py-3 text-base placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-green-500/30
          focus:border-green-500 transition-colors"
      />
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full rounded-xl bg-green-600 px-6 py-3 text-white
          font-medium transition-all
          hover:bg-green-700 active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Generating..." : "Generate"}
      </button>
    </div>
  );
}
```

### FilterControls Component Pattern

```typescript
// components/filter-controls.tsx
"use client";

import { ASPECT_RATIOS, RESOLUTIONS } from "@/lib/constants";
import type { AspectRatio, Resolution } from "@/lib/constants";

interface FilterControlsProps {
  aspectRatio: AspectRatio;
  onAspectRatioChange: (value: AspectRatio) => void;
  resolution: Resolution;
  onResolutionChange: (value: Resolution) => void;
}

export function FilterControls({
  aspectRatio,
  onAspectRatioChange,
  resolution,
  onResolutionChange,
}: FilterControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Aspect Ratio */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Aspect Ratio
        </label>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1
          md:flex-wrap md:overflow-x-visible">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.value}
              onClick={() => onAspectRatioChange(ratio.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5
                rounded-full border text-sm transition-colors
                ${aspectRatio === ratio.value
                  ? "border-green-600 bg-green-50 text-green-800"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
            >
              <span
                className="inline-block border border-current rounded-sm"
                style={{
                  width: `${10 * ratio.widthFactor}px`,
                  height: `${10 * ratio.heightFactor}px`,
                }}
              />
              {ratio.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resolution + Cost */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Resolution
        </label>
        <div className="flex gap-2">
          {RESOLUTIONS.map((res) => (
            <button
              key={res.value}
              onClick={() => onResolutionChange(res.value)}
              className={`flex items-center gap-1.5 px-4 py-1.5
                rounded-full border text-sm transition-colors
                ${resolution === res.value
                  ? "border-green-600 bg-green-50 text-green-800"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
            >
              {res.label}
            </button>
          ))}
        </div>
        {/* Cost indicator */}
        <p className="mt-1.5 text-xs text-gray-400">
          {resolution === "4K" ? "$0.24" : "$0.13"} per image
          {resolution === "4K" && (
            <span className="ml-2 text-amber-500">
              4K may take longer (up to 2 min)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
```

### Inline Error with Retry

```typescript
// Inside result-display.tsx
{error && (
  <div className="flex items-center gap-3 rounded-xl border border-red-200
    bg-red-50 px-4 py-3 text-sm text-red-700">
    <span className="flex-1">{error}</span>
    <button
      onClick={onRetry}
      className="shrink-0 rounded-lg bg-red-100 px-3 py-1 text-red-700
        font-medium hover:bg-red-200 transition-colors"
    >
      Try Again
    </button>
  </div>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JS-based textarea auto-resize (`scrollHeight` calculation) | CSS `field-sizing: content` | 2024 (Chrome 119) | Zero-JS auto-resize. BUT Safari/Firefox support still incomplete in Feb 2026. Use library as fallback. |
| JSON-wrapped base64 for image transfer | Binary response with `Content-Type: image/png` | Ongoing best practice | Avoids 33% base64 overhead, bypasses Vercel 4.5 MB limit, reduces memory usage on client. |
| Separate `AbortController` per `useEffect` | Ref-based `AbortController` in event handler | React 19 patterns | Cleaner for user-triggered actions vs. effects. |
| React ViewTransition for crossfade | **Experimental only** (Canary channel) | April 2025 | NOT stable in React 19. Do not use for production. Stick with CSS transitions. |
| CSS `cross-fade()` function | **Limited support** | Ongoing | Only works for background images, not `<img>` elements. Use opacity transitions instead. |

**Deprecated/outdated:**
- `tailwindcss-animate`: Deprecated by shadcn/ui (March 2025). Tailwind v4 has built-in animation utilities.
- React `ViewTransition` component: Still experimental/canary. Not in stable React 19. Do NOT depend on it for Phase 2.

## Open Questions

1. **Phase 1 API route response format**
   - What we know: PITFALLS.md and STACK.md both flag binary streaming as necessary for 2K/4K images. Phase 1 CONTEXT.md lists image delivery format as Claude's discretion.
   - What's unclear: Whether Phase 1 will implement binary responses or JSON-wrapped base64. This research assumes binary.
   - Recommendation: If Phase 1 implements JSON-wrapped base64, Phase 2 plan should include a task to refactor the route to binary before building the client. This is non-negotiable for 2K/4K support.

2. **CSS `field-sizing: content` browser support at implementation time**
   - What we know: Chrome 119+, Edge 119+ support it. Firefox and Safari do not (as of Feb 2026).
   - What's unclear: Whether Safari will ship support before this phase is implemented.
   - Recommendation: Default to `react-textarea-autosize` (1.3 KB). If Safari ships `field-sizing` support before implementation, switch to pure CSS.

3. **Spinner component source**
   - What we know: Phase 1 may or may not include a spinner component in `ui/`.
   - What's unclear: Whether shadcn/ui provides a spinner, or if we need a simple CSS animation.
   - Recommendation: Use a simple CSS spinner (Tailwind `animate-spin` on an SVG). No dependency needed.

## Sources

### Primary (HIGH confidence)
- [Gemini API Image Generation Documentation](https://ai.google.dev/gemini-api/docs/image-generation) -- SDK usage patterns, aspect ratios (1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9), imageSize values (1K, 2K, 4K uppercase), response parsing
- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3) -- Model capabilities, thought signatures, responseModalities configuration
- [Vercel Body Size Limit KB Article](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions) -- 4.5 MB limit, streaming bypass, binary response approach
- [MDN: CSS field-sizing property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/field-sizing) -- Browser support, usage with textareas
- [Tailwind CSS v4 Docs: Overflow](https://tailwindcss.com/docs/overflow) -- overflow-x-auto utility
- [CSS Crossfade Pattern](https://www.taniarascia.com/crossfade-between-two-images-with-css-animations/) -- Stacked images with opacity transition
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) -- Fetch request cancellation pattern

### Secondary (MEDIUM confidence)
- [react-textarea-autosize GitHub](https://github.com/Andarist/react-textarea-autosize) -- 1.3 KB gzipped, minRows/maxRows API, React 19 compatibility
- [tailwind-scrollbar-hide (v4 support)](https://github.com/reslear/tailwind-scrollbar-hide) -- `@utility scrollbar-hide` pattern for Tailwind v4
- [React Labs Blog: ViewTransition](https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more) -- ViewTransition is experimental, not stable

### Tertiary (LOW confidence)
- Community reports on CSS `field-sizing` Safari support timeline -- No official date from Apple

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries verified against Phase 1 research, minimal new dependencies
- Architecture: HIGH -- Standard React patterns (useState, controlled components, fetch), verified against existing ARCHITECTURE.md
- UI patterns: HIGH -- CSS crossfade, overflow scroll, and auto-expand textarea are well-established patterns
- Pitfalls: HIGH -- Verified against PITFALLS.md from project research; Vercel body size limit is documented

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable domain, no fast-moving dependencies)

---
*Research for Phase 2: Text-to-Image Generation -- Core generation loop UI*
*Researched: 2026-02-18*
