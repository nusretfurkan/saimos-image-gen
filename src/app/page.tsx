"use client";

import { useState, useCallback, useRef } from "react";
import { PromptInput } from "@/components/prompt-input";
import { FilterControls } from "@/components/filter-controls";
import { ResultDisplay } from "@/components/result-display";
import type { AspectRatio, Resolution } from "@/lib/constants";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [resolution, setResolution] = useState<Resolution>("1K");
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
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setIsLoading(false);
    }
  }, [prompt, aspectRatio, resolution, imageUrl]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Saimos Image Gen</h1>

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
