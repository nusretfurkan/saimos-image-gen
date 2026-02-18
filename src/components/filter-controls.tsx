"use client";

import type { AspectRatio, Resolution } from "@/lib/constants";

interface FilterControlsProps {
  aspectRatio: AspectRatio;
  onAspectRatioChange: (value: AspectRatio) => void;
  resolution: Resolution;
  onResolutionChange: (value: Resolution) => void;
}

// Placeholder component -- will be replaced by Plan 02-02
export function FilterControls(_props: FilterControlsProps) {
  return null;
}
