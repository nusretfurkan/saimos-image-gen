# Phase 3: Image-to-Image Editing - Research

**Researched:** 2026-02-18
**Domain:** Client-side image upload (file picker, drag-and-drop, clipboard paste), client-side validation, and image-to-image generation flow via Gemini API
**Confidence:** HIGH

## Summary

Phase 3 adds image-to-image editing on top of the existing text-to-image generation built in Phase 2. The core technical work divides into two halves: (1) building the image upload component with three input methods (file picker, drag-and-drop, clipboard paste), client-side format/size validation, and thumbnail preview; and (2) extending the existing API route and page component to handle the image-to-image generation flow -- sending a reference image alongside a text prompt to Gemini.

The critical finding from this research is that **thought signatures are NOT required for Phase 3's scope**. Thought signatures are only necessary for multi-turn conversational editing (which is deferred to v2 per REQUIREMENTS.md as GEN-04). Phase 3 implements single-turn image-to-image editing: the user uploads a reference image, writes an edit prompt, and gets a result. Each generation is a fresh `generateContent` call with no conversation history. This eliminates the research flag from the roadmap ("stateless thought signature management pattern for Route Handlers").

The second key finding is that native browser APIs (HTML5 drag-and-drop events, `<input type="file">`, paste event with `DataTransferItemList`) are sufficient for all three input methods. The project's stack research already ruled out `react-dropzone` (14KB for drag-and-drop that mobile users rarely use). The native approach is simpler, smaller, and fully covers the requirements.

**Primary recommendation:** Build a unified `ImageUpload` component using native browser APIs that supports all three input methods (file picker, drag-and-drop, clipboard paste) with eager client-side validation, then extend the existing `/api/generate` route to accept an optional `image` field for image-to-image mode. No conversation history. No thought signatures. No new dependencies.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

No locked implementation decisions -- user delegated all to Claude's judgment.

### Claude's Discretion

**Upload zone design**
- How the upload area looks and behaves
- Drag-and-drop visual feedback and hover states
- Prominence and integration with the prompt area
- Whether upload zone is inline, overlay, or dedicated section

**Reference image preview**
- Thumbnail size and positioning relative to prompt input
- Remove/replace behavior once an image is uploaded
- Preview quality and aspect ratio handling

**Mode switching**
- How image-to-image coexists with text-to-image
- Whether it's a separate tab, toggle, unified flow, or contextual (auto-detects when image is added)
- Transition UX between modes

**Before/after display**
- How original and transformed images are shown together
- Side-by-side, overlay, sequential, or toggle approach
- Whether comparison is optional or automatic

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GEN-02 | User can upload a reference image (JPEG/PNG/WebP, <=7MB) and enter a text prompt to generate an edited/transformed image (image-to-image) | Image upload component with file picker + drag-and-drop, base64 data URL round-trip to Gemini via `inlineData`, `generateContent` call with `[{ text: prompt }, { inlineData: { data, mimeType } }]` contents array |
| OUT-05 | User can paste image from clipboard into the upload area (image-to-image mode) | `paste` event listener on upload zone, read `clipboardData.items` for `type.startsWith("image/")`, convert to File via `getAsFile()`, then same FileReader flow as file picker |
| UX-05 | Uploaded images validated for format (JPEG/PNG/WebP) and size (<=7MB) with client-side feedback | Validate `file.type` against allowlist and `file.size` against 7MB limit immediately on file selection/drop/paste, before any FileReader or API call; show inline error with specific message |

</phase_requirements>

## Standard Stack

### Core

No new dependencies required for Phase 3. All functionality uses native browser APIs and the existing project stack.

| Library/API | Version | Purpose | Why Standard |
|-------------|---------|---------|--------------|
| HTML5 File API | Browser native | FileReader, File, Blob objects for reading uploaded images | Built-in, zero-dependency; `FileReader.readAsDataURL()` converts files to base64 data URLs for the Gemini API |
| HTML5 Drag and Drop API | Browser native | `dragenter`, `dragover`, `dragleave`, `drop` events | Built-in; provides file drag-and-drop without external libraries |
| Clipboard API (paste event) | Browser native | `paste` event + `clipboardData.items` | Supported since 2017; reads image data from system clipboard paste events |
| @google/genai | 1.x (already installed) | Gemini API client for image-to-image | Same SDK as Phase 2; `generateContent()` with `inlineData` parts handles image input |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing Tailwind CSS v4 | 4.1.x | Upload zone styling, drag states, preview layout | All visual states (idle, hover, drag-active, preview, error) |
| Existing lucide-react | 0.574.x | Upload icon, remove button icon | Upload zone visual affordance |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native drag-and-drop | react-dropzone (14KB) | react-dropzone adds 14KB for convenience methods. Native events are ~30 lines of code for our use case. Stack research already ruled out react-dropzone for this mobile-first app. |
| Native paste event | navigator.clipboard.read() | Modern Clipboard API (read()) requires HTTPS + explicit user permission prompt. Paste event is simpler, works everywhere, fires on Ctrl+V / Cmd+V without permission dialogs. |
| Client-side magic bytes validation | file-type library (58KB) | Checking file magic bytes adds reliability but 58KB of code. For this personal tool, `file.type` from the browser + `accept` attribute on `<input>` is sufficient. Server-side validation in Phase 1's route already provides defense in depth. |

**Installation:**
```bash
# No new packages required
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── image-upload.tsx       # NEW: Drag-and-drop + file picker + paste zone
│   ├── prompt-input.tsx       # EXISTING: Text prompt (from Phase 2)
│   ├── result-display.tsx     # MODIFY: Add before/after comparison view
│   ├── mode-selector.tsx      # NOT NEEDED: Contextual detection replaces explicit mode switch
│   └── ui/                    # EXISTING: Shared primitives
├── app/
│   ├── page.tsx               # MODIFY: Add image state, wire upload component
│   └── api/
│       └── generate/
│           └── route.ts       # MODIFY: Already handles image field (Phase 1)
└── lib/
    ├── types.ts               # MODIFY: Add ImageUploadState type
    ├── constants.ts           # MODIFY: Add format/size validation constants
    └── image-utils.ts         # NEW: Validation helpers, base64 utilities
```

### Pattern 1: Unified Contextual Mode (Recommended for Mode Switching)

**What:** Instead of an explicit mode toggle/tab, the app auto-detects the mode based on whether an image is uploaded. When no image is present, it behaves as text-to-image. When an image is uploaded (via any input method), it switches to image-to-image. Removing the image switches back.

**When to use:** When both modes share the same prompt input and the only difference is whether a reference image is attached.

**Why recommended over explicit tabs/toggle:**
- Eliminates a mode selection step -- one fewer decision for the user
- Matches the Google reference implementation's pattern (unified input, contextual behavior)
- Prevents "wrong mode" errors (user forgets to switch tabs)
- The prompt area stays identical in both modes -- only the upload zone appears/disappears
- Aligns with modern AI tool UX (Pinterest's multimodal flow, Google Flow's reference image pattern)

**Example:**
```typescript
// app/page.tsx (simplified)
const [uploadedImage, setUploadedImage] = useState<string | null>(null);

// Mode is derived, not stored
const isImageToImage = uploadedImage !== null;

// API call uses the same endpoint, image field is optional
const requestData = {
  prompt,
  ...(uploadedImage && { image: uploadedImage, imageMimeType }),
  aspectRatio,
  resolution,
  mode: isImageToImage ? "image-to-image" : "text-to-image",
};
```

### Pattern 2: Three-Input Upload Zone

**What:** A single upload component that accepts images from three sources: file picker (click/tap), drag-and-drop, and clipboard paste. All three converge into the same handler that validates and reads the file.

**When to use:** Always, for this phase. This is the core component.

**Example:**
```typescript
// components/image-upload.tsx (simplified structure)
function ImageUpload({ onImageSelect, onError }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Shared validation + read pipeline
  const processFile = useCallback((file: File) => {
    // 1. Validate format
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      onError("Supported formats: JPEG, PNG, WebP.");
      return;
    }
    // 2. Validate size
    if (file.size > 7 * 1024 * 1024) {
      onError("Image must be under 7 MB.");
      return;
    }
    // 3. Read as data URL
    const reader = new FileReader();
    reader.onload = (e) => onImageSelect({
      dataUrl: e.target!.result as string,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
    reader.readAsDataURL(file);
  }, [onImageSelect, onError]);

  // Input 1: File picker
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Input 2: Drag-and-drop
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  };

  // Input 3: Clipboard paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) processFile(file);
          break;
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [processFile]);

  // ... render upload zone with drag event handlers
}
```

### Pattern 3: Inline Upload Zone with Preview State

**What:** The upload zone starts as a dashed-border drop area with an upload icon and hint text. Once an image is uploaded, it transforms in-place into a thumbnail preview with the file name, file size, and a remove button. The zone occupies the same position in the layout in both states.

**When to use:** When the upload zone needs to coexist with the prompt input without layout shifts.

**Why recommended over separate/overlay approaches:**
- No layout shift when transitioning between empty and preview states
- User can see the reference image while writing the prompt
- Remove button is always accessible without modal interaction
- Matches the Google reference implementation pattern

**Example layout (empty state):**
```
┌─────────────────────────────────────────┐
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │  📤 Drop image, paste, or click  │  │
│  │     JPEG, PNG, WebP · up to 7MB  │  │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│                                         │
│  [Prompt textarea                     ] │
│  [                                    ] │
│                                         │
│  [Filters]              [  Generate  ]  │
└─────────────────────────────────────────┘
```

**Example layout (preview state):**
```
┌─────────────────────────────────────────┐
│  ┌──────┐  photo.jpg · 2.4 MB    [✕]  │
│  │ thumb│                               │
│  └──────┘                               │
│                                         │
│  [Prompt textarea                     ] │
│  [                                    ] │
│                                         │
│  [Filters]              [  Generate  ]  │
└─────────────────────────────────────────┘
```

### Pattern 4: Sequential Before/After Display (Recommended)

**What:** After image-to-image generation completes, the result display shows the original reference image as a small thumbnail above or beside the generated image, with a label like "Original" and "Result". The generated image remains the hero element (large, prominent). No slider or overlay interaction needed.

**When to use:** For a mobile-first app where screen real estate is limited and the generated result should dominate.

**Why recommended over slider/side-by-side:**
- Slider components add complexity and a new interaction pattern to learn
- Side-by-side halves the image size on mobile, making both hard to see
- The generated image is the primary output; the original is context, not equal prominence
- Users who don't want comparison can ignore the small original thumbnail
- Consistent with the existing result display pattern from Phase 2 (hero image)

**Example layout:**
```
┌─────────────────────────────────────────┐
│  ┌──────┐  Original                    │
│  │ small│                               │
│  └──────┘                               │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │        Generated Result         │    │
│  │        (hero, large)            │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Download]     [Full Screen]           │
└─────────────────────────────────────────┘
```

### Anti-Patterns to Avoid

- **Sending unvalidated files to the API:** Always validate format and size client-side before `FileReader.readAsDataURL()`. Invalid files waste bandwidth and API calls. The PRD requires client-side validation (UX-05).
- **Storing the uploaded image as both data URL string and object URL:** Pick one representation. Data URL is needed for the API call; use it for preview too. Don't create a parallel object URL for the same image.
- **Using `navigator.clipboard.read()` for paste:** This requires HTTPS + user permission prompt. The `paste` event is simpler and fires on Ctrl+V / Cmd+V without any permission dialog. Use `paste` event on `document`.
- **Building a separate API route for image-to-image:** Phase 1's `/api/generate` route already accepts an optional `image` field. Don't create `/api/edit` or `/api/image-to-image`. One route handles both modes.
- **Explicit mode toggle when contextual detection works:** Adding a tab/toggle for "Text to Image" vs "Image to Image" creates cognitive overhead. Auto-detect from the presence of an uploaded image. The PRD mentions "tabs or toggle" but CONTEXT.md delegates mode switching to Claude's discretion -- contextual is better UX.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File type detection from binary content | Custom magic bytes parser | `file.type` from browser + `accept` attribute on `<input>` | Browser's MIME detection is sufficient for a personal tool. Server-side validation in Phase 1 provides defense in depth. Magic bytes parsing adds complexity for minimal gain here. |
| Image resize/compression before upload | Custom canvas resize pipeline | Send raw file (up to 7MB per PRD) | PRD allows 7MB uploads. Vercel request body limit is 4.5MB. Base64 inflates 7MB to ~9.3MB, exceeding Vercel's limit. **However:** Phase 1 should have already addressed this with streaming or the body size limit. If Phase 1 doesn't handle large bodies, implement canvas resize (max 2048px, JPEG 80%) as a fallback here. Check Phase 1 implementation first. |
| Drag-and-drop file handling | Custom drag state machine | HTML5 Drag and Drop API with 4 event handlers | Native API is simple: `dragenter`/`dragover` (set active), `dragleave` (clear active), `drop` (read file). 15-20 lines of code. |
| Base64 data URL parsing | Custom regex parser | `dataUrl.split(",")` for prefix/data split | The data URL format is standard: `data:mime/type;base64,DATA`. Split on comma, extract. No library needed. |

**Key insight:** Phase 3's complexity is in the UX interaction design (three input methods, state transitions, visual feedback), not in the data processing. All data operations use standard browser APIs that are well-documented and widely supported.

## Common Pitfalls

### Pitfall 1: Drag-and-Drop Events Fire on Child Elements

**What goes wrong:** User drags a file over the upload zone, the `dragenter` event fires. They move the cursor over a child element (the icon, the text), `dragleave` fires on the parent, `dragenter` fires on the child. The visual feedback flickers -- the drag-active style toggles rapidly.

**Why it happens:** Drag events bubble. When the cursor enters a child element inside the drop zone, `dragleave` fires on the parent and `dragenter` fires on the child. The event target changes but the user hasn't left the zone.

**How to avoid:** Use a counter-based approach:
```typescript
let dragCounter = 0;

const handleDragEnter = (e: DragEvent) => {
  e.preventDefault();
  dragCounter++;
  setIsDragActive(true);
};

const handleDragLeave = (e: DragEvent) => {
  dragCounter--;
  if (dragCounter === 0) {
    setIsDragActive(false);
  }
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  dragCounter = 0;
  setIsDragActive(false);
  // ... process file
};
```

**Warning signs:** Upload zone border/background flickers when dragging a file over it.

### Pitfall 2: Clipboard Paste Fires Globally, Not Just on Upload Zone

**What goes wrong:** The paste event listener is attached to `document`. If the user copies text and pastes it into the prompt textarea, the paste handler intercepts it and tries to process it as an image. Or worse, pasting an image while in text-to-image mode (no upload zone visible) unexpectedly switches to image-to-image mode.

**Why it happens:** The `paste` event on `document` captures all paste actions, regardless of what element has focus.

**How to avoid:**
- Check if the paste event contains image data (`item.type.startsWith("image/")`). If no image items exist, let the event propagate normally (don't call `preventDefault()`).
- Only process paste when the upload zone is visible/active (i.e., when the user has entered image-to-image mode, OR when using the contextual mode pattern where paste is always available).
- For the contextual approach: paste with an image auto-activates image-to-image mode, which is the desired behavior.

**Warning signs:** Pasting text into the prompt field triggers image processing or shows an error.

### Pitfall 3: FileReader Blocks the Main Thread for Large Files

**What goes wrong:** `FileReader.readAsDataURL()` for a 7MB file takes noticeable time (100-500ms). During this time, the UI is unresponsive. On mobile, this feels like the app froze.

**Why it happens:** FileReader's `onload` callback fires after the entire file is read into memory as a base64 string. For large files, this is a synchronous main-thread operation.

**How to avoid:**
- Show a brief loading state on the upload zone while FileReader is working ("Reading file...").
- The actual read is async (callback-based), so the UI won't truly freeze -- but the base64 string allocation can cause a brief GC pause.
- For large files, consider using `URL.createObjectURL(file)` for the preview (zero overhead) and only read as data URL when the user clicks Generate.

**Warning signs:** Brief visual freeze when dropping a large (5MB+) image.

### Pitfall 4: Base64 Data URL Exceeds Vercel 4.5MB Request Body Limit

**What goes wrong:** A 7MB image becomes ~9.3MB after base64 encoding. Wrapping it in a JSON body with other fields pushes it further. The request to `/api/generate` fails with Vercel's 413 FUNCTION_PAYLOAD_TOO_LARGE error on production (works fine locally).

**Why it happens:** PRD allows 7MB uploads. Base64 inflates by ~33%. Vercel's 4.5MB request body limit is on the deployed platform, not local dev.

**How to avoid:**
- **Option A (preferred):** Client-side resize to max 2048px longest edge + JPEG compression at 80% quality before reading as data URL. This keeps the body under 4.5MB for virtually all images.
- **Option B:** Check if Phase 1 already solves this with streaming or a body size workaround. If it does, no action needed here.
- **Option C:** Use `multipart/form-data` instead of JSON for image uploads, which avoids base64 overhead. But this requires changing the API route's request parsing.

**Warning signs:** Large image uploads work locally but fail on Vercel with 413 errors.

### Pitfall 5: Uploaded Image Persists After Generation

**What goes wrong:** User uploads an image, generates a result. They want to do a text-to-image generation next, but the uploaded image is still in state. They type a prompt and hit Generate -- the app sends the old reference image again, producing another image-to-image edit instead of a fresh text-to-image generation.

**Why it happens:** No explicit "clear uploaded image" step after generation. The contextual mode pattern means the presence of `uploadedImage` in state determines the mode.

**How to avoid:**
- After successful generation, keep the uploaded image in state (so it shows in the before/after display) but present a clear "New Generation" or "Clear" button that resets the image state.
- Alternatively: clear the uploaded image state after generation and only show it in the before/after display via a separate `originalImage` state variable.
- The result display's "Reset" / "New" action should clear both the generated result and the uploaded reference image.

**Warning signs:** Users accidentally send the same reference image on consecutive generations.

## Code Examples

### Client-Side Image Validation

```typescript
// lib/image-utils.ts
// Source: Standard browser File API patterns

export const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_SIZE_BYTES = 7 * 1024 * 1024; // 7 MB
export const MAX_IMAGE_SIZE_LABEL = "7 MB";

export type ImageValidationError =
  | { type: "invalid-format"; message: string }
  | { type: "too-large"; message: string; fileSize: number };

export function validateImageFile(file: File): ImageValidationError | null {
  // Check format first (fast, no I/O)
  if (!VALID_IMAGE_TYPES.includes(file.type as typeof VALID_IMAGE_TYPES[number])) {
    return {
      type: "invalid-format",
      message: "Supported formats: JPEG, PNG, WebP.",
    };
  }

  // Check size
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      type: "too-large",
      message: `Image must be under ${MAX_IMAGE_SIZE_LABEL}.`,
      fileSize: file.size,
    };
  }

  return null; // Valid
}
```

### Clipboard Paste Handler

```typescript
// Inside ImageUpload component
// Source: MDN Clipboard API + ClipboardEvent documentation

useEffect(() => {
  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault(); // Only prevent default when we handle an image
        const file = item.getAsFile();
        if (file) {
          processFile(file); // Same validation + read pipeline
        }
        return; // Only process the first image
      }
    }
    // If no image found, let the event propagate (user might be pasting text)
  };

  document.addEventListener("paste", handlePaste);
  return () => document.removeEventListener("paste", handlePaste);
}, [processFile]);
```

### Drag-and-Drop with Flicker Prevention

```typescript
// Inside ImageUpload component
// Source: MDN HTML Drag and Drop API + counter pattern for child element flickering

const dragCounterRef = useRef(0);

const handleDragEnter = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounterRef.current++;
  if (e.dataTransfer.items.length > 0) {
    setIsDragActive(true);
  }
}, []);

const handleDragLeave = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounterRef.current--;
  if (dragCounterRef.current === 0) {
    setIsDragActive(false);
  }
}, []);

const handleDragOver = useCallback((e: React.DragEvent) => {
  e.preventDefault(); // Required: allows drop event to fire
  e.stopPropagation();
}, []);

const handleDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounterRef.current = 0;
  setIsDragActive(false);

  const file = e.dataTransfer.files?.[0];
  if (file) processFile(file);
}, [processFile]);
```

### Image-to-Image API Request (Client Side)

```typescript
// In page.tsx handleGenerate function
// Source: Existing Phase 2 pattern + Gemini API image generation docs

const handleGenerate = async () => {
  setLoading(true);
  setError(null);

  try {
    const body: Record<string, unknown> = {
      prompt,
      aspectRatio,
      resolution,
      mode: uploadedImage ? "image-to-image" : "text-to-image",
    };

    if (uploadedImage) {
      body.image = uploadedImage.dataUrl; // Full data URL: "data:image/png;base64,..."
      body.imageMimeType = uploadedImage.mimeType;
    }

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // ... same response handling as Phase 2
  } catch (err) {
    // ... error handling
  } finally {
    setLoading(false);
  }
};
```

### Server-Side Image-to-Image Contents Array

```typescript
// In app/api/generate/route.ts (extending Phase 1 route)
// Source: Gemini API Image Generation docs (ai.google.dev/gemini-api/docs/image-generation)

// Build the contents array
const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

// Text prompt is always first
parts.push({ text: prompt });

// Add reference image for image-to-image mode
if (image && mode === "image-to-image") {
  // Strip "data:image/png;base64," prefix to get raw base64
  const base64Data = image.split(",")[1];
  const mimeType = imageMimeType || "image/jpeg";

  parts.push({
    inlineData: {
      data: base64Data,
      mimeType,
    },
  });
}

const response = await ai.models.generateContent({
  model: MODEL_ID,
  contents: [{ role: "user", parts }],
  config: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: {
      aspectRatio,
      imageSize: resolution,
    },
  },
});
```

### Client-Side Image Resize (If Needed for Vercel Body Limit)

```typescript
// lib/image-utils.ts
// Source: Canvas API + toBlob (MDN), image compression best practices

const MAX_DIMENSION = 2048; // Pixels on longest edge
const COMPRESSION_QUALITY = 0.8; // JPEG quality

export async function resizeImageIfNeeded(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Check if resize is needed
      if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
        resolve(file); // No resize needed
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      const ratio = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height);
      const newWidth = Math.round(img.width * ratio);
      const newHeight = Math.round(img.height * ratio);

      // Draw to canvas and export
      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas export failed"));
            return;
          }
          const resizedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        },
        "image/jpeg",
        COMPRESSION_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for resize"));
    };

    img.src = objectUrl;
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-dropzone for drag-and-drop | Native HTML5 Drag and Drop API | Always available, but ecosystem shifted toward native ~2023-2024 | 14KB less bundle; simpler code for single-file use cases |
| `@google/generative-ai` for image input | `@google/genai` with `inlineData` parts | May 2025 (GA release) | Old package lacks Gemini 3 features. New SDK handles `inlineData` natively. |
| Multi-turn chat for image editing | Single-turn `generateContent` with reference image | Gemini 3 Pro supports both | Single-turn is simpler, no thought signatures needed, sufficient for v1 |
| `navigator.clipboard.read()` for paste | `paste` event + `clipboardData.items` | Both available; paste event since 2015 | Paste event requires no permission prompt, works on HTTP and HTTPS, simpler API |

**Deprecated/outdated:**
- `react-dropzone`: Not deprecated, but unnecessary for single-file upload in a mobile-first app
- `@google/generative-ai`: Deprecated by Google. Use `@google/genai`.
- `window.clipboardData` (IE-specific): Dead. Use `event.clipboardData`.

## Discretion Recommendations

Based on research, here are concrete recommendations for each Claude's Discretion area:

### Upload Zone Design: Inline Dashed-Border Zone

**Recommendation:** Place the upload zone directly above the prompt textarea as a dashed-border rectangle. When no image is uploaded, it shows an upload icon with "Drop image, paste, or click" text and format/size hints. On drag hover, the border becomes solid and the background tints with the accent color. On click, it opens the native file picker.

**Rationale:** Inline placement means zero layout disruption. The upload zone is always visible when in image-to-image flow, right where the user's attention is. No overlay to dismiss, no separate section to scroll to. Matches the Google reference implementation pattern and is immediately understandable.

### Reference Image Preview: Compact Inline Thumbnail

**Recommendation:** When an image is uploaded, the dashed-border zone transforms into a compact preview bar: a small thumbnail (48-64px), the file name (truncated), file size, and a remove/X button. The zone keeps the same vertical position but reduces height. Clicking the thumbnail could show it larger, but this is optional.

**Rationale:** The reference image is input, not output -- it should be compact, not prominent. The generated image is the hero. A large preview would push the prompt textarea and generate button further down the page, which hurts the mobile experience.

### Mode Switching: Contextual Auto-Detection

**Recommendation:** No explicit mode toggle. Upload an image -> image-to-image mode. Remove the image -> text-to-image mode. The upload zone is always visible (collapsed to a compact "attach image" affordance when in text-to-image, or full dashed-border when focused/expanded).

**Rationale:** Reduces cognitive overhead. Users don't need to "choose a mode" before acting. The presence of a reference image IS the mode. This is how modern multimodal tools work (ChatGPT's attachment, Claude's file upload). Removes one UI component (mode selector/tabs) and one state variable.

### Before/After Display: Sequential with Small Original

**Recommendation:** After image-to-image generation, show the original reference image as a small thumbnail (120-160px) labeled "Original" above the full-size generated result. The generated image remains the hero. No slider, no overlay, no side-by-side split.

**Rationale:** Mobile-first app. Side-by-side halves the image size on a phone screen. A slider adds interaction complexity. The user's primary interest is the result, not the comparison. The small original provides context without competing for attention. If the user wants to compare closely, they can tap the generated image to view fullscreen (Phase 5).

## Open Questions

1. **Vercel 4.5MB request body limit for large images**
   - What we know: PRD allows 7MB uploads. Base64 inflates to ~9.3MB. Vercel's request body limit is 4.5MB.
   - What's unclear: How Phase 1 handles this. If Phase 1 implemented streaming responses (for the output side), the input side (request body) may still hit the 4.5MB limit.
   - Recommendation: Check Phase 1's implementation. If it doesn't handle large request bodies, add client-side resize (canvas to max 2048px, JPEG 80%) in this phase. The `resizeImageIfNeeded` code example above handles this.

2. **Upload zone visibility in text-to-image mode**
   - What we know: Contextual auto-detection is recommended. The upload zone should be visible for users to discover image-to-image mode.
   - What's unclear: How prominent to make the upload affordance in text-to-image mode. A collapsed "attach image" link? A subtle icon button? Always-visible dashed zone?
   - Recommendation: Start with a compact "attach image" button or link near the prompt area. When clicked, it expands to the full dashed-border drop zone. This keeps text-to-image clean while making image-to-image discoverable. Planner decides exact UI treatment.

3. **Paste scope in contextual mode**
   - What we know: Paste listener is on `document`. In contextual mode, paste could auto-activate image-to-image.
   - What's unclear: Is auto-activating on paste desirable, or confusing? If a user copies an image in another tab and then tries to paste text in the prompt, the image paste handler should not interfere.
   - Recommendation: The paste handler checks `clipboardData.items` for image types. If the clipboard contains ONLY an image (no text), process it and auto-activate. If the clipboard contains text, let the event propagate to the textarea. If it contains both (some systems do), prefer text when the prompt textarea has focus, prefer image when the upload zone has focus.

## Sources

### Primary (HIGH confidence)
- [Gemini API Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation) -- `generateContent` with `inlineData` for image-to-image, contents array structure, config options
- [Gemini API Thought Signatures Docs](https://ai.google.dev/gemini-api/docs/thought-signatures) -- Confirms thought signatures are for multi-turn function calling / conversational editing; NOT required for single-turn image editing
- [Google Gemini Image Editing Next.js Quickstart](https://github.com/google-gemini/gemini-image-editing-nextjs-quickstart) -- Official reference implementation: route handler, page component, ImageUpload component, history management pattern. Uses react-dropzone (which we avoid) but validates the overall architecture.
- [MDN: HTML Drag and Drop API - File drag and drop](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop) -- Native drag-and-drop with `dragenter`/`dragover`/`dragleave`/`drop`, `DataTransferItem.getAsFile()`, visual feedback patterns
- [MDN: Element paste event](https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event) -- `ClipboardEvent.clipboardData.items` for reading image data from paste
- [MDN: Clipboard.read()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/read) -- Modern Clipboard API; confirmed that paste event is simpler and sufficient for our use case
- [Vercel Functions Limitations](https://vercel.com/docs/functions/limitations) -- 4.5MB request/response body limit on deployed functions

### Secondary (MEDIUM confidence)
- [Next.js GitHub Issue #57501](https://github.com/vercel/next.js/issues/57501) -- App Router Route Handlers do not have configurable body size limits; Vercel's 4.5MB platform limit is the binding constraint
- [Next.js proxyClientMaxBodySize docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/proxyClientMaxBodySize) -- Default 10MB proxy buffer; only applies when proxy is used, not direct Route Handler requests
- [Canvas image compression best practices](https://img.ly/blog/how-to-compress-an-image-before-uploading-it-in-javascript/) -- `canvas.toBlob()` with quality parameter for client-side resize/compress
- [Magic bytes validation in React](https://blog.yarsalabs.com/validate-image-with-magic-numbers-in-react/) -- Confirmed that `file.type` from browser is sufficient for personal tool; magic bytes add complexity without proportional benefit

### Tertiary (LOW confidence)
- [Mobbin](https://mobbin.com) -- Referenced for AI tool UX patterns; no specific findings extracted

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies. Native browser APIs are well-documented and universally supported. @google/genai SDK's `inlineData` pattern confirmed via official docs and reference implementation.
- Architecture: HIGH -- Pattern directly matches Google's official reference implementation. Single-turn image-to-image with `generateContent` is documented and straightforward.
- Pitfalls: HIGH -- All 5 pitfalls sourced from official docs, MDN, or confirmed through the reference implementation analysis. The drag-and-drop flickering pitfall is a well-known pattern with a standard counter-based solution.
- Discretion recommendations: MEDIUM -- UX recommendations based on analysis of competitor patterns, the Google reference implementation, and mobile-first design principles. No A/B testing data. Recommendations are sound but the planner/implementer should adjust based on how they feel during implementation.

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (30 days -- stable APIs, no fast-moving dependencies)
