import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorColor?: string;
  // Two-tone progress support
  acceptedValue?: number;
  pendingValue?: number;
  acceptedColor?: string;
  pendingColor?: string;
}

export function Progress({
  className,
  value,
  max = 100,
  indicatorColor = "bg-primary",
  acceptedValue,
  pendingValue = 0,
  acceptedColor = "bg-primary",
  pendingColor = "bg-sky-400 dark:bg-sky-500",
  ...props
}: ProgressProps) {
  const safeMax = Math.max(1, max);

  // If acceptedValue is provided, use two-tone mode
  if (typeof acceptedValue === "number") {
    const acceptedPct = Math.min(100, Math.max(0, (acceptedValue / safeMax) * 100));
    const pendingPct = Math.min(100 - acceptedPct, Math.max(0, (pendingValue / safeMax) * 100));

    return (
      <div
        className={cn(
          "relative h-2.5 w-full overflow-hidden rounded-full bg-secondary flex",
          className
        )}
        title={`${acceptedValue} зачтено (${Math.round(acceptedPct)}%), ${pendingValue} на проверке (${Math.round(pendingPct)}%)`}
        {...props}
      >
        <div
          className={cn("h-full transition-all duration-500 ease-in-out shrink-0", acceptedColor)}
          style={{ width: `${acceptedPct}%` }}
        />
        {pendingPct > 0 && (
          <div
            className={cn("h-full transition-all duration-500 ease-in-out shrink-0 opacity-90", pendingColor)}
            style={{ width: `${pendingPct}%` }}
          />
        )}
      </div>
    );
  }

  // Standard single-value mode
  const singleValue = typeof value === "number" ? value : 0;
  const percentage = Math.min(100, Math.max(0, (singleValue / safeMax) * 100));

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

