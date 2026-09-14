"use client";

import * as React from "react";
import Link from "next/link";
import { Profile, Subject, Assignment, Submission } from "@/types/database";
import { LabStatusBadge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, BookOpen, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatrixTableProps {
  students: Profile[];
  subjects: Subject[];
  assignments: Assignment[];
  submissions: Submission[];
}

export function MatrixTable({
  students,
  subjects,
  assignments,
  submissions,
}: MatrixTableProps) {
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string>(
    subjects[0]?.id || ""
  );

  // Update selected subject when subjects change
  React.useEffect(() => {
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Filter assignments by subject
  const currentSubjectAssignments = React.useMemo(() => {
    return assignments.filter((a) => a.subject_id === selectedSubjectId);
  }, [assignments, selectedSubjectId]);

  // Map submissions: `${assignment_id}_${user_id}` -> Submission
  const submissionMap = React.useMemo(() => {
    const map = new Map<string, Submission>();
    submissions.forEach((s) => {
      map.set(`${s.assignment_id}_${s.user_id}`, s);
    });
    return map;
  }, [submissions]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Сводная матрица прогресса группы</CardTitle>
          </div>

          {/* Subject Switcher */}
          {subjects.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {subjects.map((subj) => {
                const isSelected = subj.id === selectedSubjectId;
                return (
                  <button
                    key={subj.id}
                    onClick={() => setSelectedSubjectId(subj.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground border-border/70"
                    )}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: subj.color_hex || "#3b82f6" }}
                    />
                    <span>{subj.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {subjects.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground p-6">
            Предметы еще не добавлены. Создайте первый предмет в разделе «Предметы и лабы».
          </div>
        ) : currentSubjectAssignments.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground p-6">
            По предмету <span className="font-semibold text-foreground">«{selectedSubject?.title}»</span> еще нет лабораторных работ.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-y border-border/70 bg-muted/40 text-xs font-medium text-muted-foreground">
                  <th className="py-3 px-4 w-52 font-semibold">Студент группы</th>
                  {currentSubjectAssignments.map((assignment, idx) => (
                    <th key={assignment.id} className="py-3 px-3 text-center min-w-[120px]">
                      <Link
                        href={`/dashboard/assignments/${assignment.id}`}
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors text-xs font-semibold"
                        title={assignment.title}
                      >
                        <span className="truncate max-w-[100px]">{assignment.title}</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {students.map((student) => {
                  return (
                    <tr key={student.id} className="hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                            {student.full_name?.charAt(0) || "С"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate text-xs">
                              {student.full_name}
                            </div>
                            {student.role === "admin" && (
                              <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5">
                                <Sparkles className="h-2.5 w-2.5" />
                                Староста
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {currentSubjectAssignments.map((assignment) => {
                        const sub = submissionMap.get(`${assignment.id}_${student.id}`);
                        return (
                          <td key={assignment.id} className="py-3 px-3 text-center">
                            <Link
                              href={`/dashboard/assignments/${assignment.id}`}
                              className="inline-block hover:scale-105 transition-transform"
                            >
                              <LabStatusBadge status={sub?.status || "not_started"} />
                            </Link>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
