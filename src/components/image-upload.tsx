"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import {
  validateImageFile,
  resizeImageIfNeeded,
  readFileAsDataUrl,
} from "@/lib/image-utils";
import type { ImageUploadState } from "@/lib/types";

// --- Props ---

interface ImageUploadProps {
  onImageSelect: (image: ImageUploadState) => void;
  onImageRemove: () => void;
  onError: (message: string) => void;
  uploadedImage: ImageUploadState | null; // Controlled: parent owns the state
  disabled?: boolean; // Disable during generation
}

// --- Helpers ---

/** Format bytes into a human-readable string (e.g. "2.4 MB", "340 KB"). */
function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

// --- Component ---

export function ImageUpload({
  onImageSelect,
  onImageRemove,
  onError,
  uploadedImage,
  disabled = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const [isDragActive, setIsDragActive] = useState(false);

  // ---- Shared file processing pipeline ----

  const processFile = useCallback(
    async (file: File) => {
      // 1. Validate format and size
      const validationError = validateImageFile(file);
      if (validationError) {
        onError(validationError.message);
        return;
      }

      try {
        // 2. Resize if needed (for Vercel body limit)
        const resizedFile = await resizeImageIfNeeded(file);

        // 3. Read as data URL
        const dataUrl = await readFileAsDataUrl(resizedFile);

        // 4. Notify parent
        onImageSelect({
          dataUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: resizedFile.type,
        });
      } catch {
        onError("Failed to process image. Please try again.");
      }
    },
    [onImageSelect, onError]
  );

  // ---- Input method 1: File picker ----

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
      // Reset the input so re-selecting the same file triggers onChange
      if (e.target) {
        e.target.value = "";
      }
    },
    [processFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  // ---- Input method 2: Drag-and-drop (counter pattern to prevent flicker) ----

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;
      if (e.dataTransfer.items.length > 0) {
        setIsDragActive(true);
      }
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragActive(false);
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); // Required: allows drop event to fire
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  // ---- Render: empty state (upload zone) ----

  if (!uploadedImage) {
    return (
      <div
        className={`
          relative rounded-lg border-2 border-dashed p-8
          flex flex-col items-center justify-center gap-2 min-h-[120px]
          transition-all duration-200 ease-soft motion-reduce:transition-none
          ${
            isDragActive
              ? "border-sage-500 bg-sage-50/50"
              : "border-sage-300/60 bg-cream-100"
          }
          ${disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"}
        `}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label="Upload an image"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />

        <ImagePlus className="h-8 w-8 text-ink-500" strokeWidth={1.5} />

        <p className="text-sm text-ink-700 font-body">
          Drop image, paste, or <span className="text-sage-600 font-medium">browse</span>
        </p>
        <p className="text-xs text-ink-500">
          JPEG, PNG, WebP &mdash; up to 7 MB
        </p>
      </div>
    );
  }

  // ---- Render: preview state (thumbnail bar) ----

  return (
    <div
      className={`
        flex items-center gap-3 rounded-lg border border-sage-200/40 bg-cream-100 p-2 shadow-card
        ${disabled ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {/* Thumbnail */}
      <img
        src={uploadedImage.dataUrl}
        alt={uploadedImage.fileName}
        className="h-12 w-12 rounded-md shadow-card object-cover flex-shrink-0"
      />

      {/* File info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink-700 font-body truncate">
          {uploadedImage.fileName}
        </p>
        <p className="text-xs text-ink-500">
          {formatFileSize(uploadedImage.fileSize)}
        </p>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onImageRemove();
        }}
        className="flex-shrink-0 rounded-md p-1.5 text-ink-500 hover:bg-sage-50 hover:text-ink-700 transition-colors duration-200 ease-soft min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Remove uploaded image"
        disabled={disabled}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
