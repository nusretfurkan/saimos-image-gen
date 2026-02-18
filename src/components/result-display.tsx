"use client";

import { useState } from "react";
import { FullscreenViewer } from "@/components/fullscreen-viewer";
import { ImageActions } from "@/components/image-actions";

interface ResultDisplayProps {
  imageUrl: string | null;
}

export function ResultDisplay({ imageUrl }: ResultDisplayProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!imageUrl) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Clickable image -- opens fullscreen viewer */}
      <button
        type="button"
        onClick={() => setIsFullscreen(true)}
        className="group cursor-pointer overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
        aria-label="View image fullscreen"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Generated image"
          className="max-w-full rounded-xl transition-transform duration-200 ease-out group-hover:scale-[1.02] group-hover:brightness-105"
        />
      </button>

      {/* Action buttons below the image */}
      <ImageActions imageUrl={imageUrl} />

      {/* Fullscreen overlay */}
      <FullscreenViewer
        imageUrl={imageUrl}
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
      />
    </div>
  );
}
