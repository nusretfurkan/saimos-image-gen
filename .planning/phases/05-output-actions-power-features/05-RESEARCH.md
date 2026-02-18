# Phase 5: Output Actions + Power Features - Research

**Researched:** 2026-02-18
**Domain:** Browser APIs (Clipboard, download, dialog) + Gemini thinking configuration
**Confidence:** HIGH

## Summary

Phase 5 adds four features to an existing Next.js image generation app: fullscreen image viewing, PNG download, copy-to-clipboard, and a thinking level toggle. All four are low-complexity features that rely on well-supported browser APIs and a single Gemini API parameter.

The fullscreen viewer uses the native HTML `<dialog>` element with `showModal()`, which provides Escape key dismissal, focus trapping, and backdrop styling for free. Image download converts the existing base64 data URL to a Blob and triggers a download via a temporary anchor element. Copy-to-clipboard uses `navigator.clipboard.write()` with a `ClipboardItem` containing a PNG blob -- this reached Baseline browser support in March 2025 and works across all modern browsers. The thinking level toggle passes `thinkingConfig.thinkingLevel` (value `"LOW"` or `"HIGH"`) through the existing API route to Gemini, with `gemini-3-pro-image-preview` confirmed as a supported model on the Vertex AI thinking documentation.

**Primary recommendation:** Use native browser APIs for all output actions (no libraries needed) and pass the thinking level as a string parameter through the existing API route. No new dependencies required.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

These are fixed -- not at Claude's discretion:
- Fullscreen: dark semi-transparent backdrop, image displayed at contain (not cover), close via X button + backdrop click + Escape key
- Download: filename format `saimos-gen-{timestamp}.png`, trigger native save on mobile
- Thinking: two levels only -- low and high

### Claude's Discretion

The user delegated all implementation decisions to Claude. The following areas are flexible during planning and implementation:

**Fullscreen viewer feel:**
- Opening/closing transitions and animations
- What's visible in the overlay (image metadata, prompt text, or image only)
- Pinch-to-zoom on mobile (PRD says "nice-to-have, not required")
- Overall lightbox experience and gesture handling

**Image action buttons:**
- Button placement (below image, overlay on hover, toolbar, etc.)
- Icon-only vs icon+text vs text-only style
- Success/failure feedback pattern (toasts, inline confirmation, etc.)
- Copy-to-clipboard fallback when Clipboard API is unavailable

**Thinking level control:**
- Where the toggle lives in the UI (near filters, separate section, etc.)
- Default level (low or high)
- Label and terminology ("Thinking Level", "Quality", etc.)
- How the quality vs speed tradeoff is communicated to the user

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OUT-02 | User can view generated image in fullscreen (dark overlay, contain-fit, close via X/backdrop/Escape) | Native `<dialog>` element with `showModal()` provides Escape, focus trap, and `::backdrop` styling. Close-on-backdrop-click requires a thin wrapper checking click target. See Architecture Pattern 1. |
| OUT-03 | User can download generated image as `saimos-gen-{timestamp}.png` | Base64 to Blob conversion + temporary `<a download>` anchor. See Code Example 1. No library needed. |
| OUT-04 | User can copy generated image to clipboard | `navigator.clipboard.write()` with `ClipboardItem({ "image/png": blob })`. Baseline support since March 2025. Feature-detect with `ClipboardItem.supports("image/png")`. See Code Example 2. |
| GEN-03 | User can toggle thinking level (low/high) to trade speed for quality | `thinkingConfig.thinkingLevel` parameter with values `"LOW"` or `"HIGH"`. Gemini 3 Pro Image confirmed as supported model in Vertex AI docs. `LOW` reduces latency ~30-50%. See Architecture Pattern 4. |
</phase_requirements>

## Standard Stack

### Core

No new libraries needed. Phase 5 uses only native browser APIs and the existing project stack.

| Technology | Purpose | Why Standard |
|------------|---------|--------------|
| HTML `<dialog>` element | Fullscreen overlay | Native browser element. Provides built-in Escape key dismissal, focus trapping, `::backdrop` pseudo-element for dark overlay. Supported in all modern browsers (Baseline since March 2022). Zero JS needed for core modal behavior. |
| `navigator.clipboard.write()` | Copy image to clipboard | Async Clipboard API with image support. Reached Baseline Newly Available in March 2025. Works in Chrome 76+, Safari 13.1+, Firefox 127+, Edge 79+. Only API that supports writing binary image data to clipboard. |
| `URL.createObjectURL()` + `<a download>` | Download image as file | Standard pattern for triggering file downloads from in-memory data. Universally supported. No library needed. |
| `thinkingConfig.thinkingLevel` | Gemini thinking level control | Native `@google/genai` SDK parameter. Accepted values for Gemini 3 Pro Image: `"LOW"` and `"HIGH"`. Passed inside the existing `config` object in `generateContent()`. |

### Supporting

| Library | Already Installed | Purpose | When to Use |
|---------|-------------------|---------|-------------|
| lucide-react | Yes (from Phase 1) | Icons for action buttons | Download, Copy, Fullscreen, X close button icons |
| sonner | Yes (from Phase 1) | Toast notifications | Success/failure feedback for copy-to-clipboard action |
| clsx + tailwind-merge | Yes (from Phase 1) | Conditional class composition | Toggle states, button variants |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<dialog>` | Headless UI Dialog / Radix Dialog | These add focus management and composability, but `<dialog>` already provides focus trapping, Escape handling, and backdrop natively. For a single fullscreen image viewer, the native element is simpler and dependency-free. |
| `navigator.clipboard.write()` | Canvas-based `toBlob()` + `execCommand("copy")` | `execCommand("copy")` is deprecated and only supports text. The Async Clipboard API is the current standard. No reason to use the legacy approach in 2026. |
| Temporary `<a download>` | `file-saver` library (npm) | `file-saver` wraps the same pattern with cross-browser fallbacks for IE. Since this project targets modern browsers only, the native approach is sufficient. |

**Installation:**
```bash
# No new packages needed for Phase 5
```

## Architecture Patterns

### Recommended Component Structure

```
src/
├── components/
│   ├── fullscreen-viewer.tsx    # <dialog>-based fullscreen overlay (NEW)
│   ├── image-actions.tsx        # Download + Copy buttons (NEW)
│   ├── thinking-toggle.tsx      # Low/High toggle control (NEW)
│   └── result-display.tsx       # Existing — updated to include actions + click handler
├── lib/
│   ├── image-utils.ts           # base64ToBlob, downloadImage, copyImageToClipboard (NEW)
│   └── types.ts                 # Existing — add ThinkingLevel type
├── app/
│   ├── page.tsx                 # Existing — add thinkingLevel state, pass to API
│   └── api/
│       └── generate/
│           └── route.ts         # Existing — accept and forward thinkingLevel
```

### Pattern 1: Native `<dialog>` Fullscreen Viewer

**What:** Use the HTML `<dialog>` element with `showModal()` to create a fullscreen overlay for the generated image.
**When to use:** Whenever a modal overlay is needed with Escape key dismissal, focus trapping, and backdrop styling.
**Why native:** The `<dialog>` element provides: (1) Escape key closes automatically, (2) focus is trapped inside, (3) `::backdrop` pseudo-element is styleable, (4) `aria-modal="true"` is set automatically, (5) content behind is marked inert.

**Key implementation details:**
- Call `dialogRef.current.showModal()` to open, `dialogRef.current.close()` to close
- The `::backdrop` pseudo-element gets styled with `background: rgba(0, 0, 0, 0.85)` for the dark semi-transparent backdrop (locked requirement)
- Image uses `object-fit: contain` (locked requirement) -- never cropped
- Close on backdrop click: listen for `click` on the `<dialog>` itself, check if `event.target === dialogRef.current` (the dialog, not its children)
- Close on Escape: built-in behavior of `showModal()`, but sync React state via the `cancel` event
- X button in top-right corner: standard close trigger, calls `dialogRef.current.close()`

**React state sync caveat:** When the native `<dialog>` closes via Escape, React state is not automatically updated. Must listen for the `cancel` or `close` event on the dialog and update the parent's `isOpen` state.

**Example:**
```typescript
// Source: MDN <dialog> element + React integration pattern
import { useRef, useEffect } from "react";

interface FullscreenViewerProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FullscreenViewer({ imageUrl, isOpen, onClose }: FullscreenViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Sync React state when native dialog closes (Escape key)
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    // Close only when clicking the backdrop (dialog element itself), not its children
    if (e.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 m-0 h-screen w-screen max-h-none max-w-none bg-transparent p-0"
    >
      {/* Fullscreen container */}
      <div className="flex h-full w-full items-center justify-center p-4">
        <button
          onClick={() => dialogRef.current?.close()}
          className="absolute top-4 right-4 z-10 text-white"
          aria-label="Close fullscreen view"
        >
          {/* X icon */}
        </button>
        <img
          src={imageUrl}
          alt="Generated image fullscreen"
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </dialog>
  );
}
```

**CSS for backdrop:**
```css
dialog::backdrop {
  background: rgba(0, 0, 0, 0.85);
}
```

### Pattern 2: Base64 to Blob Conversion Utility

**What:** Convert a base64 data URL (the format the app stores generated images) to a Blob for use by both download and clipboard operations.
**When to use:** Before any operation that needs binary image data (download, clipboard copy).
**Why shared:** Both download and clipboard copy need the same Blob. Extract once, use twice.

```typescript
// Source: standard base64 to Blob pattern (MDN, web.dev)
export function base64ToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

  const byteString = atob(base64);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }

  return new Blob([byteArray], { type: mimeType });
}
```

### Pattern 3: Download via Temporary Anchor

**What:** Create a temporary `<a>` element with `download` attribute, set its `href` to an object URL, click it programmatically, then clean up.
**When to use:** Triggering a file download from in-memory data (Blob or data URL).

```typescript
// Source: standard browser download pattern
export function downloadImage(dataUrl: string): void {
  const blob = base64ToBlob(dataUrl);
  const url = URL.createObjectURL(blob);
  const timestamp = Date.now();

  const a = document.createElement("a");
  a.href = url;
  a.download = `saimos-gen-${timestamp}.png`; // Locked filename format
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Clean up the object URL to release memory
  URL.revokeObjectURL(url);
}
```

**Mobile note:** The `<a download>` attribute triggers native download behavior on iOS Safari (14.5+) and Chrome Android. On older iOS versions, it may open the image in a new tab instead -- this is acceptable fallback behavior.

### Pattern 4: Thinking Level API Integration

**What:** Pass the thinking level through the existing API route to Gemini's `generateContent` config.
**When to use:** Every generation request. The thinking level is a user-selected preference.

**Client sends:**
```typescript
// In the fetch call from page.tsx
const res = await fetch("/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt,
    image: uploadedImage,
    aspectRatio,
    resolution,
    thinkingLevel, // "LOW" or "HIGH"
  }),
});
```

**Server receives and forwards:**
```typescript
// In app/api/generate/route.ts
const { prompt, image, aspectRatio, resolution, thinkingLevel } = await req.json();

const response = await ai.models.generateContent({
  model: "gemini-3-pro-image-preview",
  contents: [{ role: "user", parts }],
  config: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: {
      aspectRatio: aspectRatio || "1:1",
      imageSize: resolution || "1K",
    },
    thinkingConfig: {
      thinkingLevel: thinkingLevel || "HIGH", // Default to HIGH (model default)
    },
  },
});
```

**Values:** Only two valid values for `gemini-3-pro-image-preview`: `"LOW"` and `"HIGH"`. The model defaults to `"HIGH"` (dynamic) when not specified. You cannot set `"MINIMAL"` or `"MEDIUM"` -- those are Flash-only.

### Anti-Patterns to Avoid

- **Don't use `window.open()` for download:** This opens a new tab with the image instead of triggering a download. The `<a download>` pattern is the correct approach.
- **Don't use `document.execCommand("copy")` for clipboard:** This is deprecated, only supports text, and does not work for images. Use the Async Clipboard API.
- **Don't create a custom modal with `position: fixed` + `z-index`:** The native `<dialog>` element handles stacking context, focus trapping, accessibility, and Escape key natively. A custom overlay requires reimplementing all of these.
- **Don't store the thinking level in server-side state:** It is a per-request parameter. Pass it in the request body like the other generation options (aspect ratio, resolution).
- **Don't use `useEffect` to hold base64 + Blob simultaneously:** Convert to Blob on-demand when the user clicks download or copy. Do not pre-convert and hold both in memory.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal/overlay with focus trap + Escape + backdrop | Custom `<div>` with `position: fixed`, manual `keydown` listener, manual focus trap | HTML `<dialog>` element + `showModal()` | Native element handles focus trapping, Escape dismissal, backdrop, inert content, and ARIA attributes automatically. Custom implementations invariably miss edge cases (multiple modals, screen readers, touch devices). |
| Clipboard image copy | Custom canvas rendering + `execCommand("copy")` | `navigator.clipboard.write()` + `ClipboardItem` | The Async Clipboard API is the standard. `execCommand` is deprecated and doesn't support images. Canvas-based workarounds add complexity for no benefit. |
| File download from memory | Custom Blob storage + IndexedDB round-trip | `URL.createObjectURL()` + `<a download>` click | The anchor download pattern is the browser-standard way to trigger downloads. Any alternative adds unnecessary complexity. |
| Toast notification system | Custom toast component with portal, animations, queue management | sonner (already installed) | sonner handles accessibility, stacking, animations, and auto-dismiss. Building a toast system is deceptively complex. |

**Key insight:** Phase 5 features are all thin wrappers around browser APIs. The complexity is in getting the details right (React state sync, mobile behavior, error handling), not in the core implementation.

## Common Pitfalls

### Pitfall 1: React State Out of Sync with Native `<dialog>`

**What goes wrong:** The `<dialog>` element can be closed by pressing Escape (native behavior), but React's `isOpen` state remains `true`. On next render, React tries to show an already-closed dialog, or the UI shows stale state.
**Why it happens:** Native `<dialog>` manages its own open/closed state independently of React. The `cancel` event (Escape) and `close` event fire on the DOM element but React's state management is unaware.
**How to avoid:** Always listen for the `close` event on the dialog element and call the parent's `onClose` callback to sync state. Never rely solely on React state to determine if the dialog is open -- check `dialogRef.current.open` as the source of truth.
**Warning signs:** Dialog "flickers" on re-open. Escape key stops working after the first use. Console warnings about calling `showModal()` on an already-open dialog.

### Pitfall 2: Clipboard Write Fails Silently Without HTTPS

**What goes wrong:** `navigator.clipboard.write()` is undefined or throws `NotAllowedError` during development or on non-HTTPS deployments.
**Why it happens:** The Clipboard API requires a secure context (HTTPS). During local development, `localhost` is treated as secure, but any non-localhost HTTP URL will fail. Additionally, some browsers require the document to have focus when clipboard write is called.
**How to avoid:** Feature-detect before showing the copy button: check both `navigator.clipboard?.write` existence and `ClipboardItem.supports?.("image/png")`. Hide or disable the button when unsupported. On Vercel, HTTPS is automatic -- this is mainly a dev/testing concern.
**Warning signs:** Copy button works locally but fails in certain browsers or non-HTTPS staging environments.

### Pitfall 3: Download Filename Ignored on Some Mobile Browsers

**What goes wrong:** The `download` attribute on `<a>` tags is not fully respected on older iOS Safari versions (pre-14.5). Instead of downloading with the specified filename, the browser opens the image in a new tab.
**Why it happens:** iOS Safari historically treated downloads differently. Support for the `download` attribute with blob URLs was added in Safari 14.5 (iOS 14.5, released April 2021).
**How to avoid:** Accept this as a graceful degradation. On older iOS, the user can long-press the image and "Save Image" from the context menu. The vast majority of devices in 2026 run iOS 15+, so this affects a negligible number of users.
**Warning signs:** Testing on iOS simulators with older versions shows the image opening in a new tab instead of downloading.

### Pitfall 4: Base64 to Blob Conversion Blocks the Main Thread

**What goes wrong:** For large images (2K, 4K), the `atob()` + byte array conversion can take 50-200ms, causing a visible UI jank when the user clicks download or copy.
**Why it happens:** `atob()` decodes the entire base64 string synchronously, and creating a `Uint8Array` iterates over every byte. A 4K PNG image at ~3-5MB base64 means processing 3-5 million characters.
**How to avoid:** For most images (1K resolution), this is imperceptible (<10ms). For 2K/4K, consider using `fetch(dataUrl).then(r => r.blob())` which leverages the browser's optimized internal Blob creation and runs off the main thread. This is a drop-in replacement for the manual `atob` approach.
**Warning signs:** Visible button press delay on 4K images. UI freeze measured with Performance DevTools.

### Pitfall 5: Thinking Level Validation Missing on Server

**What goes wrong:** A malformed request sends `thinkingLevel: "MEDIUM"` or `thinkingLevel: "off"` to the Gemini API, which returns a 400 error because `gemini-3-pro-image-preview` only accepts `"LOW"` and `"HIGH"`.
**Why it happens:** Client-side UI only offers two options, but the API route does not validate the value. A direct API call or a bug could pass an invalid value.
**How to avoid:** Validate `thinkingLevel` server-side. Accept only `"LOW"` or `"HIGH"`. Default to `"HIGH"` if missing or invalid. Add to the existing zod validation schema.
**Warning signs:** 400 errors from Gemini with messages about invalid thinking config.

## Code Examples

Verified patterns from official sources:

### Example 1: Download Image from Base64 Data URL

```typescript
// Source: standard browser download pattern (MDN URL.createObjectURL, <a download>)
export function downloadImage(dataUrl: string): void {
  // Efficient: use fetch to convert data URL to blob (off main thread)
  fetch(dataUrl)
    .then((res) => res.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const timestamp = Date.now();
      const a = document.createElement("a");
      a.href = url;
      a.download = `saimos-gen-${timestamp}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
}
```

### Example 2: Copy Image to Clipboard

```typescript
// Source: MDN Clipboard.write(), web.dev clipboard patterns
export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  // Feature detection
  if (!navigator.clipboard?.write) {
    return false;
  }

  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Clipboard API requires image/png specifically
    const pngBlob = blob.type === "image/png"
      ? blob
      : await convertToPngBlob(blob); // If Gemini returns non-PNG, convert

    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": pngBlob }),
    ]);
    return true;
  } catch (err) {
    console.error("Clipboard write failed:", err);
    return false;
  }
}
```

### Example 3: Feature Detection for Clipboard Support

```typescript
// Source: MDN ClipboardItem.supports()
export function isClipboardImageSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.clipboard?.write &&
    typeof ClipboardItem !== "undefined" &&
    // ClipboardItem.supports is itself a newer API; check existence
    (typeof ClipboardItem.supports === "function"
      ? ClipboardItem.supports("image/png")
      : true) // Assume supported if supports() method doesn't exist
  );
}
```

### Example 4: Thinking Level API Config

```typescript
// Source: Google AI Gemini API thinking docs, Vertex AI docs
// In app/api/generate/route.ts

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Inside POST handler:
const response = await ai.models.generateContent({
  model: "gemini-3-pro-image-preview",
  contents: [{ role: "user", parts }],
  config: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: {
      aspectRatio: aspectRatio || "1:1",
      imageSize: resolution || "1K",
    },
    thinkingConfig: {
      thinkingLevel: thinkingLevel === "LOW" ? "LOW" : "HIGH",
    },
  },
});
```

### Example 5: Thinking Level Toggle UI

```typescript
// Discretion area: recommended approach
// Place near existing filter controls (aspect ratio, resolution)

interface ThinkingToggleProps {
  level: "LOW" | "HIGH";
  onChange: (level: "LOW" | "HIGH") => void;
}

export function ThinkingToggle({ level, onChange }: ThinkingToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Quality</span>
      <div className="flex rounded-lg border">
        <button
          onClick={() => onChange("LOW")}
          className={cn(
            "px-3 py-1.5 text-sm rounded-l-lg transition-colors",
            level === "LOW" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
        >
          Fast
        </button>
        <button
          onClick={() => onChange("HIGH")}
          className={cn(
            "px-3 py-1.5 text-sm rounded-r-lg transition-colors",
            level === "HIGH" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
        >
          Quality
        </button>
      </div>
    </div>
  );
}
```

## Discretion Recommendations

Based on research, these are the recommended approaches for areas where Claude has discretion:

### Fullscreen Viewer Feel

**Recommendation:** Image only (no metadata). Subtle fade-in transition (150ms opacity). No pinch-to-zoom for v1.
**Rationale:** The fullscreen viewer's purpose is unobstructed viewing. Metadata clutters the view. Pinch-to-zoom requires touch gesture handling (touch-action CSS, transform tracking) that adds complexity for a "nice-to-have." Can be added in v2 (OUT-06 is already a v2 requirement).

### Image Action Buttons

**Recommendation:** Below the image in a horizontal row. Icon + short text (e.g., Download icon + "Download"). Use sonner toasts for copy feedback ("Copied to clipboard" / "Copy failed").
**Rationale:** Below-image placement is discoverable on mobile without occluding the image. Icon-only buttons have discoverability problems. Toasts are the standard feedback pattern for clipboard actions -- they're non-blocking and auto-dismiss.

### Thinking Level Control

**Recommendation:** Place alongside existing filters (aspect ratio, resolution) as a segmented control. Default to `HIGH` (matches Gemini's default). Label as "Quality" with options "Fast" and "Quality". Show a subtle hint: "Fast generates ~30% quicker."
**Rationale:** Grouping with filters keeps all generation parameters together. "Quality" is more intuitive than "Thinking Level" for end users. Defaulting to HIGH matches the model's default behavior and ensures the best output quality out of the box.

### Copy-to-Clipboard Fallback

**Recommendation:** Hide the copy button entirely when `navigator.clipboard.write` is unavailable. Do not show a disabled button or a fallback.
**Rationale:** There is no viable text-based fallback for copying a PNG image. A disabled button with a tooltip ("Not supported in this browser") adds clutter without value. The download button always works as the primary action.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom modal with `position: fixed` + manual focus trap | HTML `<dialog>` + `showModal()` | Baseline March 2022 | No JS needed for focus trap, Escape dismissal, backdrop. Reduces code and accessibility bugs. |
| `document.execCommand("copy")` for clipboard | `navigator.clipboard.write()` + `ClipboardItem` | Baseline June 2024 (text), March 2025 (images) | Supports binary data (images), async, Promise-based. The old API only supported text and is deprecated. |
| `thinkingBudget` (token count) for Gemini | `thinkingLevel` (enum: LOW/HIGH) for Gemini 3 | Gemini 3 launch (2025) | Simpler API. Cannot use both in same request (400 error). Gemini 3 Pro Image only accepts `LOW` or `HIGH`. |
| Base64 data URL for downloads | `fetch(dataUrl).then(r => r.blob())` for Blob conversion | Always available, preferred pattern | Using `fetch` for data URL to Blob conversion is more efficient than manual `atob()` + byte array. Runs off the main thread in most browsers. |

**Deprecated/outdated:**
- `document.execCommand("copy")`: Deprecated. Only supports text. Not available in secure contexts in some browsers.
- `thinkingBudget` for Gemini 3 models: Returns 400 error. Use `thinkingLevel` instead.
- `@google/generative-ai` package: Deprecated. Use `@google/genai` (already in the project stack).

## Open Questions

1. **Does `thinkingLevel: "LOW"` measurably improve speed for `gemini-3-pro-image-preview`?**
   - What we know: The Vertex AI thinking docs list `gemini-3-pro-image-preview` as a supported model for `thinkingLevel`. Third-party benchmarks report 30-50% latency reduction with LOW vs HIGH for image generation. Official Gemini image generation docs say thinking "is enabled by default and cannot be disabled" but do not mention level control explicitly.
   - What's unclear: Whether the official AI Studio docs (not Vertex AI) support `thinkingLevel` for image models, or if this is Vertex AI-only. The thinking docs page and the image generation docs page do not cross-reference each other.
   - Recommendation: Implement the toggle and pass the parameter. If the API rejects it, catch the error and fall back to not sending `thinkingConfig`. Log the error for debugging. This is a safe approach -- the worst case is the parameter is ignored or a caught error falls back gracefully.
   - Confidence: MEDIUM (Vertex AI docs confirm support; AI Studio docs are ambiguous)

2. **Will `fetch(dataUrl)` work for large base64 data URLs (4K images, ~5MB)?**
   - What we know: `fetch()` can accept data URLs and returns a Response with a Blob. This is standardized behavior.
   - What's unclear: Whether browser implementations have size limits on data URL fetch. No documented limits found, but 4K base64 strings are unusually large (5-8MB).
   - Recommendation: Use `fetch(dataUrl)` as the primary approach. If it fails for large images, fall back to the manual `atob()` + `Uint8Array` conversion. Test with actual 4K generated images during implementation.
   - Confidence: HIGH (standard behavior, no documented limits)

## Sources

### Primary (HIGH confidence)
- [MDN: Clipboard.write()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write) -- Clipboard API specification, browser compatibility, security requirements
- [MDN: `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) -- Native dialog element, showModal(), backdrop, close events
- [MDN: `::backdrop` pseudo-element](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::backdrop) -- Styling the dialog backdrop
- [web.dev: Copy images to clipboard](https://web.dev/patterns/clipboard/copy-images) -- Official clipboard image patterns with feature detection
- [Google AI: Gemini thinking docs](https://ai.google.dev/gemini-api/docs/thinking) -- thinkingLevel parameter, values per model, SDK usage
- [Google AI: Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3) -- Gemini 3 thinking levels, thought signatures, model capabilities
- [Google AI: Image Generation docs](https://ai.google.dev/gemini-api/docs/image-generation) -- Image generation config, imageConfig parameters
- [Google Cloud: Vertex AI Thinking docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/thinking) -- Model compatibility table confirming gemini-3-pro-image-preview supports thinkingLevel
- [Google Cloud: Gemini 3 Pro Image](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-pro-image) -- Model specs, supported parameters, capabilities list

### Secondary (MEDIUM confidence)
- [web.dev: Dialog element](https://web.dev/learn/html/dialog) -- Dialog usage patterns and accessibility
- [Gemini 3 Pro Image API Pricing & Speed Test](https://blog.laozhang.ai/en/posts/gemini-3-pro-image-api-pricing-speed-test) -- Third-party benchmark reporting 30-50% speed improvement with LOW thinking
- [googleapis/js-genai on GitHub](https://github.com/googleapis/js-genai) -- SDK source, codegen instructions for thinkingLevel usage

### Tertiary (LOW confidence)
- Third-party blog claims about "standard mode vs Thinking Mode" for image generation -- not corroborated by official Google documentation. The official docs confirm thinkingLevel exists for the model but don't explicitly document speed/quality differences for image generation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All APIs are well-documented, browser-native, and at Baseline support levels
- Architecture: HIGH -- Patterns are standard React + browser API integrations with no novel complexity
- Pitfalls: HIGH -- Dialog/React sync issues and clipboard security requirements are well-documented
- Thinking level for image generation: MEDIUM -- Vertex AI docs confirm model support, but AI Studio docs don't explicitly document it for image models

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable APIs, 30-day validity)
