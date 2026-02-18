"use client";

import { useState, useRef, useEffect } from "react";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      className="animate-spin h-6 w-6 text-sage-500"
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

  // --- State 1: Nothing generated yet (warm empty state) ---
  if (!imageUrl && !isLoading && !error) {
    return (
      <div className="flex min-h-[300px] md:min-h-[400px] flex-col items-center justify-center gap-3 rounded-xl bg-cream-100 shadow-card">
        <ImageIcon className="h-10 w-10 text-sage-300" strokeWidth={1.5} />
        <p className="text-sm text-ink-500 font-body">
          Your creation will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Before/after: show original thumbnail when in image-to-image mode */}
      {originalImage && imageUrl && (
        <div>
          <p className="mb-1 text-xs text-ink-500 font-body">Original</p>
          <img
            src={originalImage}
            alt="Original reference image"
            className="h-auto w-32 rounded-md shadow-card border border-sage-200/40 object-contain"
          />
        </div>
      )}

      {/* --- State 3: First-time loading (no image yet) --- */}
      {!hasAnyImage && isLoading && (
        <div className="flex min-h-[300px] md:min-h-[400px] items-center justify-center rounded-xl bg-cream-100 shadow-card">
          <div className="flex flex-col items-center gap-3">
            <Spinner />
            <span className="text-sm font-medium text-ink-500 font-body">
              Generating...
            </span>
          </div>
        </div>
      )}

      {/* --- State 2: Has image (hero element -- minimal chrome, image IS the design) --- */}
      {hasAnyImage && (
        <div className="relative overflow-hidden rounded-xl bg-cream-100 shadow-card transition-shadow duration-200 ease-soft hover:shadow-elevated">
          {/* Previous image for crossfade during regeneration */}
          {previousImageRef.current &&
            previousImageRef.current !== imageUrl && (
              <img
                src={previousImageRef.current}
                alt=""
                className={`absolute inset-0 w-full h-auto transition-opacity duration-500 ease-soft ${
                  imageLoaded ? "opacity-0" : "opacity-100"
                }`}
              />
            )}

          {/* Current image */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Generated image"
              className={`w-full h-auto object-contain transition-opacity duration-500 ease-soft ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={handleImageLoad}
            />
          )}

          {/* Loading overlay (spinner on top of previous image during regeneration) */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-900/30 backdrop-blur-sm rounded-xl">
              <div className="flex flex-col items-center gap-3">
                <Spinner />
                <span className="text-cream-50 text-sm font-medium font-body">
                  Generating...
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error state (below the image container, not replacing it) */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-error/20 bg-error-bg px-4 py-3 text-sm text-error font-body">
          <span className="flex-1">{error}</span>
          <Button
            variant="outline"
            onClick={onRetry}
            className="shrink-0 border-error/30 text-error hover:bg-error-bg min-h-[36px] px-3 py-1"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
