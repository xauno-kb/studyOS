import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorColor?: string;
}

export function Progress({
  className,
  value = 0,
  max = 100,
  indicatorColor = "bg-primary",
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <div
        className={cn("h-full transition-all duration-500 ease-in-out", indicatorColor)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
