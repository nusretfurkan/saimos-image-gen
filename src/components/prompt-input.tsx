"use client";

import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: PromptInputProps) {
  const canSubmit = value.trim().length > 0 && !isLoading;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return; // Skip during IME composition
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <label className="font-heading text-lg font-semibold text-ink-900">
        Prompt
      </label>
      <TextareaAutosize
        minRows={2}
        maxRows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe the image you want to create..."
        className="w-full resize-none rounded-md px-4 py-3
          font-body text-base text-ink-900 placeholder:text-ink-500
          bg-cream-200 border border-sage-200/50
          focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-500/20
          transition-all duration-200 ease-soft
          motion-reduce:transition-none
          min-h-[44px]"
      />
      <p className="text-xs text-ink-500">
        {value.length > 0
          ? `${value.length} characters`
          : "Press Cmd+Enter to generate"}
      </p>
      <Button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full"
      >
        {isLoading ? "Generating..." : "Generate"}
      </Button>
    </div>
  );
}
