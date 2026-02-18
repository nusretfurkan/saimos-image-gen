"use client";

import type { ThinkingLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ThinkingToggleProps {
  level: ThinkingLevel;
  onChange: (level: ThinkingLevel) => void;
}

const OPTIONS: { value: ThinkingLevel; label: string; hint: string }[] = [
  { value: "LOW", label: "Fast", hint: "~30% quicker" },
  { value: "HIGH", label: "Quality", hint: "Best results" },
];

export function ThinkingToggle({ level, onChange }: ThinkingToggleProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-ink-700">Quality</span>
      <div className="inline-flex rounded-lg border border-ink-200 bg-cream-100 p-0.5">
        {OPTIONS.map((option) => {
          const isActive = level === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "relative flex min-h-[44px] items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-sage-600 text-cream-50 shadow-sm"
                  : "text-ink-500 hover:text-ink-700"
              )}
              aria-pressed={isActive}
            >
              {option.label}
              <span
                className={cn(
                  "text-xs font-normal",
                  isActive ? "text-cream-200" : "text-ink-400"
                )}
              >
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
