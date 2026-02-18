"use client";

import { ASPECT_RATIOS, RESOLUTIONS } from "@/lib/constants";
import type { AspectRatio, Resolution } from "@/lib/constants";

interface FilterControlsProps {
  aspectRatio: AspectRatio;
  onAspectRatioChange: (value: AspectRatio) => void;
  resolution: Resolution;
  onResolutionChange: (value: Resolution) => void;
}

export function FilterControls({
  aspectRatio,
  onAspectRatioChange,
  resolution,
  onResolutionChange,
}: FilterControlsProps) {
  const selectedResolution = RESOLUTIONS.find((r) => r.value === resolution);
  const cost = selectedResolution?.cost ?? "$0.13";
  const is4K = resolution === "4K";

  return (
    <div className="space-y-4">
      {/* Aspect Ratio Section */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-ink-700">
          Aspect Ratio
        </label>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 md:flex-wrap md:overflow-x-visible">
          {ASPECT_RATIOS.map((ratio) => {
            const isSelected = aspectRatio === ratio.value;
            return (
              <button
                key={ratio.value}
                type="button"
                onClick={() => onAspectRatioChange(ratio.value)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  isSelected
                    ? "border-green-600 bg-green-50 text-green-800"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <span
                  className="inline-block rounded-sm border border-current"
                  style={{
                    width: `${10 * ratio.widthFactor}px`,
                    height: `${10 * ratio.heightFactor}px`,
                  }}
                />
                {ratio.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resolution Section */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-ink-700">
          Resolution
        </label>
        <div className="flex gap-2">
          {RESOLUTIONS.map((res) => {
            const isSelected = resolution === res.value;
            return (
              <button
                key={res.value}
                type="button"
                onClick={() => onResolutionChange(res.value)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  isSelected
                    ? "border-green-600 bg-green-50 text-green-800"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {res.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          {cost} per image
          {is4K && (
            <span className="ml-2 text-amber-500">
              4K may take longer (up to 2 min)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
