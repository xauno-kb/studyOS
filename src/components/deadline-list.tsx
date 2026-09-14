import Link from "next/link";
import { Assignment, Submission } from "@/types/database";
import { LabStatusBadge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle, ArrowRight, CheckCircle, Calendar } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface DeadlineItemProps {
  assignment: Assignment;
  submission?: Submission;
}

export function DeadlineList({
  assignments,
  submissions,
}: {
  assignments: Assignment[];
  submissions: Record<string, Submission>;
}) {
  const now = new Date();

  // Sort assignments by deadline
  const assignmentsWithDeadline = assignments
    .filter((a) => a.deadline)
    .map((a) => {
      const deadlineDate = new Date(a.deadline!);
      const diffMs = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const submission = submissions[a.id];
      const isDone = submission?.status === "accepted";

      return {
        assignment: a,
        submission,
        deadlineDate,
        diffDays,
        isOverdue: diffMs < 0 && !isDone,
        isUrgent: diffDays <= 3 && diffDays >= 0 && !isDone,
        isDone,
      };
    })
    .sort((a, b) => a.deadlineDate.getTime() - b.deadlineDate.getTime());

  if (assignmentsWithDeadline.length === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Ближайшие дедлайны
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-sm text-muted-foreground">
            Нет активных дедлайнов. Отличная работа! 🎉
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Ближайшие дедлайны
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Всего задач: {assignmentsWithDeadline.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {assignmentsWithDeadline.slice(0, 5).map(({ assignment, submission, diffDays, isOverdue, isUrgent, isDone }) => (
          <Link
            key={assignment.id}
            href={`/dashboard/assignments/${assignment.id}`}
            className={cn(
              "group block p-3 rounded-xl border transition-all hover:bg-accent/50",
              isOverdue
                ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
                : isUrgent
                ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                : "border-border/60 bg-card/50"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {assignment.subject && (
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${assignment.subject.color_hex || "#3b82f6"}20`,
                        color: assignment.subject.color_hex || "#3b82f6",
                      }}
                    >
                      {assignment.subject.title}
                    </span>
                  )}
                  {isOverdue && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400">
                      <AlertTriangle className="h-3 w-3" />
                      Просрочено
                    </span>
                  )}
                  {isUrgent && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                      <Clock className="h-3 w-3" />
                      Осталось {diffDays} {diffDays === 1 ? "день" : "дня"}
                    </span>
                  )}
                </div>

                <div className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {assignment.title}
                </div>

                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(assignment.deadline)}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <LabStatusBadge status={submission?.status || "not_started"} />
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
