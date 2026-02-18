// Image validation and resize utilities for the upload component.
// All functions use native browser APIs -- no external dependencies.

// --- Constants ---

export const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_IMAGE_SIZE_BYTES = 7 * 1024 * 1024; // 7 MB

export const MAX_IMAGE_SIZE_LABEL = "7 MB";

/** Maximum dimension (longest edge) before client-side resize kicks in. */
const MAX_DIMENSION = 2048;

/** JPEG quality used when resizing images via canvas. */
const COMPRESSION_QUALITY = 0.8;

// --- Validation ---

/**
 * Validates a File for format and size before any I/O.
 *
 * Checks format FIRST (fast, synchronous) then size.
 * Returns `null` when the file is valid, or an error object describing the issue.
 */
export function validateImageFile(
  file: File
): { type: string; message: string } | null {
  // 1. Format check (fast, no I/O)
  if (
    !VALID_IMAGE_TYPES.includes(
      file.type as (typeof VALID_IMAGE_TYPES)[number]
    )
  ) {
    return {
      type: "invalid-format",
      message: "Supported formats: JPEG, PNG, WebP.",
    };
  }

  // 2. Size check
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      type: "too-large",
      message: `Image must be under ${MAX_IMAGE_SIZE_LABEL}.`,
    };
  }

  return null; // Valid
}

// --- Resize ---

/**
 * Resizes an image if either dimension exceeds MAX_DIMENSION (2048 px).
 *
 * - Creates an Image element from the file via `URL.createObjectURL`.
 * - If both dimensions are <= MAX_DIMENSION, returns the original file unchanged.
 * - Otherwise scales to fit within MAX_DIMENSION on the longest edge (aspect ratio preserved).
 * - Exports via `canvas.toBlob("image/jpeg", COMPRESSION_QUALITY)`.
 * - Returns a new File from the blob with the original name and `image/jpeg` type.
 * - Revokes the object URL in both success and error paths to prevent memory leaks.
 */
export async function resizeImageIfNeeded(file: File): Promise<File> {
  return new Promise<File>((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // No resize needed
      if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
        resolve(file);
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      const ratio = Math.min(
        MAX_DIMENSION / img.width,
        MAX_DIMENSION / img.height
      );
      const newWidth = Math.round(img.width * ratio);
      const newHeight = Math.round(img.height * ratio);

      // Draw to canvas and export as JPEG
      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas 2d context"));
        return;
      }

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

// --- File reading ---

/**
 * Reads a File as a data URL string.
 *
 * Wraps `FileReader.readAsDataURL()` in a Promise.
 * Resolves with the full data URL (e.g. "data:image/png;base64,...").
 * Rejects with an error on read failure.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file as data URL"));
    };

    reader.readAsDataURL(file);
  });
}

// --- Download & Clipboard ---

/**
 * Download a base64 data URL as a PNG file.
 * Filename format: saimos-gen-{timestamp}.png (LOCKED)
 *
 * Uses fetch-based Blob conversion (off main thread) to avoid blocking on large images.
 */
export function downloadImage(dataUrl: string): void {
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

/**
 * Copy a base64 data URL image to the clipboard.
 * Returns true on success, false on failure or if unsupported.
 */
export async function copyImageToClipboard(
  dataUrl: string
): Promise<boolean> {
  if (!navigator.clipboard?.write) {
    return false;
  }

  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Clipboard API requires image/png specifically
    const pngBlob =
      blob.type === "image/png"
        ? blob
        : new Blob([await blob.arrayBuffer()], { type: "image/png" });

    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": pngBlob }),
    ]);
    return true;
  } catch (err) {
    console.error("Clipboard write failed:", err);
    return false;
  }
}

/**
 * Check if the browser supports writing images to the clipboard.
 * SSR-safe: returns false on the server.
 */
export function isClipboardImageSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.clipboard?.write &&
    typeof ClipboardItem !== "undefined" &&
    (typeof ClipboardItem.supports === "function"
      ? ClipboardItem.supports("image/png")
      : true)
  );
}
