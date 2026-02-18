"use client";

import TextareaAutosize from "react-textarea-autosize";

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
    <div className="flex flex-col gap-3">
      <TextareaAutosize
        minRows={2}
        maxRows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe the image you want to create..."
        className="w-full resize-none rounded-xl border border-gray-200
          px-4 py-3 text-base placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-green-500/30
          focus:border-green-500 transition-colors"
      />
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full rounded-xl bg-green-600 px-6 py-3 text-white
          font-medium transition-all
          hover:bg-green-700 active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Generating..." : "Generate"}
      </button>
    </div>
  );
}
