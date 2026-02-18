import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg bg-cream-100 p-6 shadow-card border border-sage-200/40",
          "transition-shadow duration-200 ease-soft",
          "hover:shadow-elevated",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export { Card };
export type { CardProps };
