"use client";

import { useState, useCallback, useRef } from "react";
import { PromptInput } from "@/components/prompt-input";
import { FilterControls } from "@/components/filter-controls";
import { ThinkingToggle } from "@/components/thinking-toggle";
import { ResultDisplay } from "@/components/result-display";
import type { AspectRatio, Resolution } from "@/lib/constants";
import type { ThinkingLevel } from "@/lib/types";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [resolution, setResolution] = useState<Resolution>("1K");
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>("HIGH");
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
          thinkingLevel,
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
  }, [prompt, aspectRatio, resolution, thinkingLevel, imageUrl]);

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
            />
          </section>
        </div>
      </div>
    </main>
  );
}
