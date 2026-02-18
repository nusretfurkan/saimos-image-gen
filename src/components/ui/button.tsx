import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-sage-500 text-white",
    "hover:bg-sage-600",
    "active:bg-sage-700 active:scale-[0.98]",
    "disabled:hover:bg-sage-500",
    "focus-visible:ring-sage-500/50 focus-visible:ring-offset-cream-50",
  ].join(" "),
  outline: [
    "border border-sage-300 text-sage-700",
    "hover:bg-sage-50",
    "active:bg-sage-100",
    "focus-visible:ring-sage-500/50 focus-visible:ring-offset-cream-50",
  ].join(" "),
  ghost: [
    "text-sage-700",
    "hover:bg-sage-50",
    "active:bg-sage-100",
    "focus-visible:ring-sage-500/50 focus-visible:ring-offset-cream-50",
  ].join(" "),
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center rounded-md px-5 py-2.5",
          "font-body text-sm font-medium",
          "min-h-[44px]",
          // Transitions
          "transition-all duration-200 ease-soft",
          "motion-reduce:transition-none",
          // Focus ring
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          // Disabled
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Variant
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps, ButtonVariant };
