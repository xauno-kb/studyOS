"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Profile,
  Semester,
  Subject,
  Assignment,
  Submission,
} from "@/types/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LabStatusBadge } from "@/components/ui/badge";
import { SemesterModal } from "@/components/semester-modal";
import { SubjectModal } from "@/components/subject-modal";
import { AssignmentModal } from "@/components/assignment-modal";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen,
  Plus,
  ExternalLink,
  MessageSquare,
  GraduationCap,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SubjectsViewProps {
  profile: Profile;
  semesters: Semester[];
  subjects: Subject[];
  assignments: Assignment[];
  mySubmissions: Submission[];
}

export function SubjectsView({
  profile,
  semesters,
  subjects,
  assignments,
  mySubmissions,
}: SubjectsViewProps) {
  const router = useRouter();
  const isAdmin = profile.role === "admin";

  // State
  const [selectedSemesterId, setSelectedSemesterId] = React.useState<string>(
    semesters.find((s) => s.is_active)?.id || semesters[0]?.id || ""
  );

  // Modals state
  const [semesterModalOpen, setSemesterModalOpen] = React.useState(false);
  const [editingSemester, setEditingSemester] = React.useState<Semester | null>(null);

  const [subjectModalOpen, setSubjectModalOpen] = React.useState(false);
  const [editingSubject, setEditingSubject] = React.useState<Subject | null>(null);

  const [assignmentModalOpen, setAssignmentModalOpen] = React.useState(false);
  const [targetSubjectId, setTargetSubjectId] = React.useState<string>("");
  const [editingAssignment, setEditingAssignment] = React.useState<Assignment | null>(null);

  // Filter subjects by selected semester
  const filteredSubjects = subjects.filter(
    (s) => s.semester_id === selectedSemesterId
  );

  // Map assignments by subject_id
  const assignmentsBySubject = React.useMemo(() => {
    const map = new Map<string, Assignment[]>();
    assignments.forEach((a) => {
      const list = map.get(a.subject_id) || [];
      list.push(a);
      map.set(a.subject_id, list);
    });
    return map;
  }, [assignments]);

  // Map my submissions by assignment_id
  const mySubmissionMap = React.useMemo(() => {
    const map = new Map<string, Submission>();
    mySubmissions.forEach((s) => map.set(s.assignment_id, s));
    return map;
  }, [mySubmissions]);

  // Handle Delete Subject
  const handleDeleteSubject = async (subjectId: string, title: string) => {
    if (!confirm(`Вы действительно хотите удалить предмет «${title}» и все его лабораторные?`)) {
      return;
    }
    const supabase = createClient();
    await supabase.from("subjects").delete().eq("id", subjectId);
    router.refresh();
  };

  // Handle Delete Assignment
  const handleDeleteAssignment = async (assignmentId: string, title: string) => {
    if (!confirm(`Вы действительно хотите удалить лабораторную «${title}»?`)) {
      return;
    }
    const supabase = createClient();
    await supabase.from("assignments").delete().eq("id", assignmentId);
    router.refresh();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Semester Control */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Предметы и лабораторные работы</h1>
          <p className="text-sm text-muted-foreground">
            Учебные дисциплины, методические указания, контакты преподавателей и трекинг сдачи
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Semester Selector */}
          {semesters.length > 0 && (
            <div className="flex items-center gap-1.5 bg-card border border-border/70 p-1 rounded-xl">
              {semesters.map((sem) => (
                <button
                  key={sem.id}
                  onClick={() => setSelectedSemesterId(sem.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    sem.id === selectedSemesterId
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sem.name}
                  {sem.is_active && <span className="ml-1.5 text-[10px] opacity-80">(активен)</span>}
                </button>
              ))}
            </div>
          )}

          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingSemester(null);
                  setSemesterModalOpen(true);
                }}
                className="gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Семестр
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setEditingSubject(null);
                  setSubjectModalOpen(true);
                }}
                className="gap-1 text-xs"
                disabled={!selectedSemesterId}
              >
                <Plus className="h-3.5 w-3.5" />
                Добавить предмет
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-base font-semibold">В этом семестре еще нет предметов</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
              {isAdmin
                ? "Нажмите кнопку «Добавить предмет» выше, чтобы создать первую дисциплину."
                : "Староста еще не добавил дисциплины для текущего семестра."}
            </p>
            {isAdmin && (
              <Button
                onClick={() => {
                  setEditingSubject(null);
                  setSubjectModalOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Создать предмет
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSubjects.map((subject) => {
            const subjectAssignments = assignmentsBySubject.get(subject.id) || [];
            const totalLabs = subjectAssignments.length;
            const completedLabs = subjectAssignments.filter((a) => {
              const sub = mySubmissionMap.get(a.id);
              return sub?.status === "accepted";
            }).length;

            return (
              <Card
                key={subject.id}
                className="border-border/60 overflow-hidden flex flex-col justify-between"
              >
                {/* Subject Card Top Banner */}
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: subject.color_hex || "#3b82f6" }}
                />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>{subject.title}</span>
                      </CardTitle>
                      {subject.teacher_name && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5" />
                          <span>{subject.teacher_name}</span>
                          {subject.teacher_contact && (
                            <span className="text-primary font-medium">({subject.teacher_contact})</span>
                          )}
                        </p>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingSubject(subject);
                            setSubjectModalOpen(true);
                          }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteSubject(subject.id, subject.title)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* External Links */}
                  {(subject.moodle_url || subject.chat_url) && (
                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      {subject.moodle_url && (
                        <a
                          href={subject.moodle_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Moodle
                        </a>
                      )}
                      {subject.chat_url && (
                        <a
                          href={subject.chat_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Беседа группы
                        </a>
                      )}
                    </div>
                  )}

                  {/* Subject Description */}
                  {subject.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {subject.description}
                    </p>
                  )}

                  {/* Progress */}
                  <div className="pt-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Мой прогресс по предмету:</span>
                      <span className="font-semibold text-foreground">
                        {completedLabs} из {totalLabs} сдано
                      </span>
                    </div>
                    <Progress
                      value={completedLabs}
                      max={Math.max(1, totalLabs)}
                      indicatorColor="bg-primary"
                    />
                  </div>
                </CardHeader>

                {/* Assignments List */}
                <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 mt-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Лабораторные работы ({totalLabs})
                    </div>

                    {subjectAssignments.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-border/70 text-center text-xs text-muted-foreground">
                        Лабораторные еще не добавлены
                      </div>
                    ) : (
                      subjectAssignments.map((assignment) => {
                        const mySub = mySubmissionMap.get(assignment.id);
                        return (
                          <div
                            key={assignment.id}
                            className="p-3 rounded-xl border border-border/60 bg-card/40 hover:bg-accent/40 transition-colors flex items-center justify-between gap-3 group"
                          >
                            <Link
                              href={`/dashboard/assignments/${assignment.id}`}
                              className="min-w-0 flex-1"
                            >
                              <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                {assignment.title}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                {assignment.deadline && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(assignment.deadline)}
                                  </span>
                                )}
                                {assignment.material_file_url && (
                                  <span className="flex items-center gap-1 text-primary/80">
                                    <FileText className="h-3 w-3" />
                                    Методичка
                                  </span>
                                )}
                              </div>
                            </Link>

                            <div className="flex items-center gap-2 shrink-0">
                              <LabStatusBadge status={mySub?.status || "not_started"} />

                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}

                              <Link
                                href={`/dashboard/assignments/${assignment.id}`}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTargetSubjectId(subject.id);
                        setEditingAssignment(null);
                        setAssignmentModalOpen(true);
                      }}
                      className="w-full mt-4 gap-1.5 text-xs border-dashed"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Добавить лабораторную работу
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <SemesterModal
        open={semesterModalOpen}
        onOpenChange={setSemesterModalOpen}
        semesterToEdit={editingSemester}
      />

      <SubjectModal
        open={subjectModalOpen}
        onOpenChange={setSubjectModalOpen}
        semesterId={selectedSemesterId}
        subjectToEdit={editingSubject}
      />

      <AssignmentModal
        open={assignmentModalOpen}
        onOpenChange={setAssignmentModalOpen}
        subjectId={targetSubjectId}
        assignmentToEdit={editingAssignment}
      />
    </div>
  );
}
