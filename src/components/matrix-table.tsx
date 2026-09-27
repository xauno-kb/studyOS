"use client";

import * as React from "react";
import Link from "next/link";
import { Profile, Subject, Assignment, Submission } from "@/types/database";
import { LabStatusBadge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, BookOpen, ExternalLink, ShieldCheck, Filter } from "lucide-react";
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
  const [filterMode, setFilterMode] = React.useState<"all" | "submitted">("all");

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

  // Assignments that have at least one submission with status "accepted" or "review_pending"
  const assignmentsWithSubmissions = React.useMemo(() => {
    return currentSubjectAssignments.filter((assignment) => {
      return students.some((student) => {
        const sub = submissionMap.get(`${assignment.id}_${student.id}`);
        return sub?.status === "accepted" || sub?.status === "review_pending";
      });
    });
  }, [currentSubjectAssignments, students, submissionMap]);

  // Visible assignments based on filter
  const visibleAssignments = React.useMemo(() => {
    if (filterMode === "submitted") {
      return assignmentsWithSubmissions;
    }
    return currentSubjectAssignments;
  }, [filterMode, assignmentsWithSubmissions, currentSubjectAssignments]);

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

        {/* Filter Toggle: All vs Submitted only */}
        {currentSubjectAssignments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 p-0.5 bg-muted/60 rounded-lg border border-border/70 text-xs">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={cn(
                  "px-3 py-1 rounded-md text-xs transition-all",
                  filterMode === "all"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground font-medium"
                )}
              >
                Все работы ({currentSubjectAssignments.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("submitted")}
                className={cn(
                  "px-3 py-1 rounded-md text-xs transition-all flex items-center gap-1.5",
                  filterMode === "submitted"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground font-medium"
                )}
              >
                <Filter className="h-3 w-3 text-primary" />
                <span>Только со сдачами ({assignmentsWithSubmissions.length})</span>
              </button>
            </div>

            {filterMode === "submitted" && (
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Скрыты работы ({currentSubjectAssignments.length - assignmentsWithSubmissions.length}) без сдач
              </span>
            )}
          </div>
        )}
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
        ) : visibleAssignments.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground p-6 space-y-2.5">
            <p>
              По предмету <span className="font-semibold text-foreground">«{selectedSubject?.title}»</span> пока нет сданных работ.
            </p>
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
            >
              <span>Показать все работы ({currentSubjectAssignments.length})</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-y border-border/70 bg-muted/40 text-xs font-medium text-muted-foreground">
                  <th className="py-3 px-4 w-52 font-semibold">Студент группы</th>
                  {visibleAssignments.map((assignment, idx) => (
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
                                <ShieldCheck className="h-3 w-3" />
                                Староста
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {visibleAssignments.map((assignment) => {
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

      {/* Practical Status Legend */}
      <div className="px-5 py-3 border-t border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground text-[11px]">Обозначения статусов:</span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Зачтено</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span>На проверке</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>В процессе</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span>Доработка</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
            <span>Не начато</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
