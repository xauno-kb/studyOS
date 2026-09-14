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
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
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

  React.useEffect(() => {
    if (!selectedSemesterId || !semesters.some((s) => s.id === selectedSemesterId)) {
      const active = semesters.find((s) => s.is_active) || semesters[0];
      if (active) {
        setSelectedSemesterId(active.id);
      }
    }
  }, [semesters, selectedSemesterId]);

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
      {semesters.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-16 text-center">
            <Calendar className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold">Сначала создайте учебный семестр</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
              {isAdmin
                ? "Чтобы добавлять предметы и лабораторные работы, создайте первый семестр (например: «3 курс, 1 семестр»)."
                : "Староста еще не настроил учебный семестр."}
            </p>
            {isAdmin && (
              <Button
                onClick={() => {
                  setEditingSemester(null);
                  setSemesterModalOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Создать первый семестр
              </Button>
            )}
          </CardContent>
        </Card>
      ) : filteredSubjects.length === 0 ? (
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
                className="border-border/60 overflow-hidden flex flex-col justify-between hover:border-border transition-all shadow-sm"
              >
                {/* Subject Card Top Banner */}
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: subject.color_hex || "#3b82f6" }}
                />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/subjects/${subject.id}`}
                        className="text-lg font-bold hover:text-primary transition-colors truncate block"
                      >
                        {subject.title}
                      </Link>
                      {subject.teacher_name && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 truncate">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                          <span>{subject.teacher_name}</span>
                        </p>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
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

                  {/* Progress & Minimal Lab Stats */}
                  <div className="pt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Сдано работ:</span>
                      <span className="font-semibold text-foreground">
                        {completedLabs} из {totalLabs} ({totalLabs > 0 ? Math.round((completedLabs / totalLabs) * 100) : 0}%)
                      </span>
                    </div>
                    <Progress
                      value={completedLabs}
                      max={Math.max(1, totalLabs)}
                      indicatorColor="bg-primary"
                    />
                  </div>
                </CardHeader>

                <CardFooter className="pt-0 pb-4">
                  <Link
                    href={`/dashboard/subjects/${subject.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-xs font-semibold transition-colors"
                  >
                    <span>Перейти к предмету</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardFooter>
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
        semesters={semesters}
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
