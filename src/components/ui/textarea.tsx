import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          // Base
          "w-full rounded-md px-4 py-3",
          "font-body text-base text-ink-900",
          "placeholder:text-ink-500",
          "bg-cream-200",
          "min-h-[44px]",
          // Border
          "border border-sage-200/50",
          // Focus
          "focus:border-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-500/20",
          // Transitions
          "transition-all duration-200 ease-soft",
          "motion-reduce:transition-none",
          // Resize
          "resize-none",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
