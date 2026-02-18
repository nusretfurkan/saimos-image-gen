"use client";

import { useState, useRef, useEffect } from "react";

interface ResultDisplayProps {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  originalImage?: string | null;
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-6 w-6 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function ResultDisplay({
  imageUrl,
  isLoading,
  error,
  onRetry,
  originalImage,
}: ResultDisplayProps) {
  const previousImageRef = useRef<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // When imageUrl changes, reset loaded state so the new image can fade in
  const currentImageRef = useRef<string | null>(null);
  if (imageUrl !== currentImageRef.current) {
    // imageUrl changed: prepare for crossfade
    if (imageUrl !== null && currentImageRef.current !== null) {
      // Regeneration: store previous for crossfade
      previousImageRef.current = currentImageRef.current;
    }
    currentImageRef.current = imageUrl;
    if (imageUrl !== null) {
      setImageLoaded(false);
    }
  }

  // When imageUrl becomes null, reset everything
  useEffect(() => {
    if (imageUrl === null) {
      previousImageRef.current = null;
      currentImageRef.current = null;
      setImageLoaded(false);
    }
  }, [imageUrl]);

  const handleImageLoad = () => {
    const prevUrl = previousImageRef.current;
    setImageLoaded(true);

    // Revoke the previous blob URL to free memory (if different from current)
    if (prevUrl && prevUrl !== imageUrl) {
      URL.revokeObjectURL(prevUrl);
    }
    previousImageRef.current = imageUrl;
  };

  // Determine if we have any image to show (current or previous)
  const hasAnyImage = imageUrl !== null || previousImageRef.current !== null;

  // --- State 1: Nothing generated yet ---
  if (!imageUrl && !isLoading && !error) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Before/after: show original thumbnail when in image-to-image mode */}
      {originalImage && imageUrl && (
        <div>
          <p className="mb-1 text-xs text-ink-400">Original</p>
          <img
            src={originalImage}
            alt="Original reference image"
            className="h-auto w-32 rounded-md border border-sage-200 object-contain"
          />
        </div>
      )}

      {/* --- State 3: First-time loading (no image yet) --- */}
      {!hasAnyImage && isLoading && (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Spinner />
            <span className="text-sm font-medium text-ink-500">
              Generating...
            </span>
          </div>
        </div>
      )}

      {/* --- State 2: Has image (and possibly loading overlay) --- */}
      {hasAnyImage && (
        <div className="relative overflow-hidden rounded-xl">
          {/* Previous image for crossfade during regeneration */}
          {previousImageRef.current &&
            previousImageRef.current !== imageUrl && (
              <img
                src={previousImageRef.current}
                alt=""
                className={`absolute inset-0 w-full h-auto transition-opacity duration-500 ${
                  imageLoaded ? "opacity-0" : "opacity-100"
                }`}
              />
            )}

          {/* Current image */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Generated image"
              className={`w-full h-auto transition-opacity duration-500 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={handleImageLoad}
            />
          )}

          {/* Loading overlay (spinner on top of previous image during regeneration) */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-xl">
              <div className="flex flex-col items-center gap-3">
                <Spinner />
                <span className="text-white text-sm font-medium">
                  Generating...
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error state (below the image container, not replacing it) */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-lg bg-red-100 px-3 py-1 text-red-700 font-medium hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
