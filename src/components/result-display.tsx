"use client";

import { Loader2 } from "lucide-react";

interface ResultDisplayProps {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  originalImage?: string | null; // Data URL of the reference image for before/after
}

export function ResultDisplay({
  imageUrl,
  isLoading,
  error,
  onRetry,
  originalImage,
}: ResultDisplayProps) {
  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-gray-200 bg-white/60">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sage-500" />
          <p className="text-sm text-ink-500">Generating image...</p>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50/50 px-6">
        <p className="text-center text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  // --- Empty state (no image yet) ---
  if (!imageUrl) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white/40">
        <p className="text-sm text-ink-400">
          Your generated image will appear here
        </p>
      </div>
    );
  }

  // --- Result state ---
  return (
    <div>
      {/* Before/after: show original thumbnail when in image-to-image mode */}
      {originalImage && (
        <div className="mb-4">
          <p className="mb-1 text-xs text-gray-500">Original</p>
          <img
            src={originalImage}
            alt="Original reference image"
            className="h-auto w-32 rounded-md border border-gray-200 object-contain"
          />
        </div>
      )}

      {/* Generated image (hero element) */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <img
          src={imageUrl}
          alt="Generated image"
          className="h-auto w-full"
        />
      </div>
    </div>
  );
}
