import * as React from "react";
import { cn } from "@/lib/utils";
import { LabStatus, EventType } from "@/types/database";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-destructive text-destructive-foreground",
    outline: "text-foreground border-border",
    success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400 font-medium",
    warning: "border-amber-500/30 bg-amber-500/15 text-amber-400 font-medium",
    info: "border-blue-500/30 bg-blue-500/15 text-blue-400 font-medium",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export function LabStatusBadge({ status }: { status?: LabStatus | null }) {
  switch (status) {
    case "accepted":
      return (
        <Badge variant="success" className="gap-1 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Зачтено
        </Badge>
      );
    case "review_pending":
      return (
        <Badge variant="info" className="gap-1 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          На проверке
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="warning" className="gap-1 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          В процессе
        </Badge>
      );
    case "revision_needed":
      return (
        <Badge variant="destructive" className="gap-1 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          Доработка
        </Badge>
      );
    case "not_started":
    default:
      return (
        <Badge variant="secondary" className="gap-1 text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
          Не начато
        </Badge>
      );
  }
}

export function EventTypeBadge({ type }: { type: EventType }) {
  switch (type) {
    case "deadline":
      return <Badge variant="destructive">Дедлайн</Badge>;
    case "test":
      return <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Тест / КР</Badge>;
    case "colloquium":
      return <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">Коллоквиум</Badge>;
    case "exam":
      return <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30">Экзамен / Зачет</Badge>;
    case "consultation":
      return <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30">Консультация</Badge>;
    case "other":
    default:
      return <Badge variant="secondary">Событие</Badge>;
  }
}
