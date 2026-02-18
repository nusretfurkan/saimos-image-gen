"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { PromptInput } from "@/components/prompt-input";
import { FilterControls } from "@/components/filter-controls";
import { ThinkingToggle } from "@/components/thinking-toggle";
import { ImageUpload } from "@/components/image-upload";
import { ResultDisplay } from "@/components/result-display";
import {
  validateImageFile,
  resizeImageIfNeeded,
  readFileAsDataUrl,
} from "@/lib/image-utils";
import type { AspectRatio, Resolution } from "@/lib/constants";
import type { ThinkingLevel, ImageUploadState } from "@/lib/types";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [resolution, setResolution] = useState<Resolution>("1K");
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>("HIGH");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Image upload state
  const [uploadedImage, setUploadedImage] = useState<ImageUploadState | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Original image for before/after display
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  // Contextual mode detection (derived, not stored)
  const isImageToImage = uploadedImage !== null;

  // --- Clipboard paste handler (page-level) ---

  const processImageFile = useCallback(async (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setUploadError(validationError.message);
      return;
    }

    try {
      const resizedFile = await resizeImageIfNeeded(file);
      const dataUrl = await readFileAsDataUrl(resizedFile);

      setUploadedImage({
        dataUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: resizedFile.type,
      });
      setUploadError(null);
    } catch {
      setUploadError("Failed to process image. Please try again.");
    }
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            processImageFile(file);
          }
          return;
        }
      }
      // If no image found, let the event propagate (user pasting text into prompt)
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [processImageFile]);

  // --- Generation handler ---

  const handleGenerate = useCallback(async () => {
    // Abort any in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    // Store original image for before/after display
    if (isImageToImage && uploadedImage) {
      setOriginalImage(uploadedImage.dataUrl);
    } else {
      setOriginalImage(null);
    }

    try {
      const body: Record<string, unknown> = {
        prompt,
        aspectRatio,
        resolution,
        thinkingLevel,
        mode: isImageToImage ? "image-to-image" : "text-to-image",
      };

      if (uploadedImage) {
        body.image = uploadedImage.dataUrl;
        body.imageMimeType = uploadedImage.mimeType;
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setOriginalImage(null);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, aspectRatio, resolution, thinkingLevel, imageUrl, isImageToImage, uploadedImage]);

  return (
    <main className="min-h-screen bg-cream-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <header className="mb-8 md:mb-12">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink-900 md:text-3xl">
            Saimos&apos; Image Gen
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Generate and transform images with AI
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(320px,2fr)_3fr] md:gap-12 lg:gap-16">
          <aside className="space-y-6 md:max-w-lg">
            <div>
              <ImageUpload
                onImageSelect={(image) => {
                  setUploadedImage(image);
                  setUploadError(null);
                }}
                onImageRemove={() => {
                  setUploadedImage(null);
                  setUploadError(null);
                }}
                onError={(msg) => setUploadError(msg)}
                uploadedImage={uploadedImage}
                disabled={isLoading}
              />
              {uploadError && (
                <p className="mt-2 text-xs text-red-500">{uploadError}</p>
              )}
            </div>

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

            <ThinkingToggle
              level={thinkingLevel}
              onChange={setThinkingLevel}
            />
          </aside>

          <section className="md:sticky md:top-8 md:self-start">
            <ResultDisplay
              imageUrl={imageUrl}
              isLoading={isLoading}
              error={error}
              onRetry={handleGenerate}
              originalImage={originalImage}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
