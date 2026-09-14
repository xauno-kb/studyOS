"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Profile,
  Subject,
  Assignment,
  Submission,
  SubjectMaterial,
  SubjectNote,
} from "@/types/database";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { LabStatusBadge } from "@/components/ui/badge";
import { AssignmentModal } from "@/components/assignment-modal";
import { SubjectModal } from "@/components/subject-modal";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen,
  Plus,
  ExternalLink,
  MessageSquare,
  GraduationCap,
  Download,
  Upload,
  FileText,
  Clock,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Edit2,
  Sparkles,
  User,
  Calendar,
  Send,
  Loader2,
  FileDown,
  Paperclip,
  Save,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SubjectDetailViewProps {
  profile: Profile;
  subject: Subject;
  assignments: Assignment[];
  mySubmissions: Submission[];
  materials: SubjectMaterial[];
  notes: SubjectNote[];
}

export function SubjectDetailView({
  profile,
  subject,
  assignments,
  mySubmissions,
  materials: initialMaterials,
  notes: initialNotes,
}: SubjectDetailViewProps) {
  const router = useRouter();
  const isAdmin = profile.role === "admin";
  const isMainAdmin = profile.email?.toLowerCase() === "hasleranet@gmail.com";

  // State
  const [materials, setMaterials] = React.useState<SubjectMaterial[]>(initialMaterials);
  const [notes, setNotes] = React.useState<SubjectNote[]>(initialNotes);

  // Modals
  const [subjectModalOpen, setSubjectModalOpen] = React.useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = React.useState(false);
  const [editingAssignment, setEditingAssignment] = React.useState<Assignment | null>(null);

  // Material Upload Modal
  const [materialModalOpen, setMaterialModalOpen] = React.useState(false);
  const [materialTitle, setMaterialTitle] = React.useState("");
  const [materialFile, setMaterialFile] = React.useState<File | null>(null);
  const [uploadingMaterial, setUploadingMaterial] = React.useState(false);

  // Course Syllabus Upload Modal (for Admin)
  const [syllabusModalOpen, setSyllabusModalOpen] = React.useState(false);
  const [syllabusFile, setSyllabusFile] = React.useState<File | null>(null);
  const [uploadingSyllabus, setUploadingSyllabus] = React.useState(false);

  // Editable Description
  const [description, setDescription] = React.useState(subject.description || "");
  const [isEditingDesc, setIsEditingDesc] = React.useState(false);
  const [savingDesc, setSavingDesc] = React.useState(false);

  // Material Edit Modal
  const [editingMaterial, setEditingMaterial] = React.useState<SubjectMaterial | null>(null);
  const [editMatTitle, setEditMatTitle] = React.useState("");
  const [editMatFile, setEditMatFile] = React.useState<File | null>(null);
  const [updatingMaterial, setUpdatingMaterial] = React.useState(false);

  // Note Edit State
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = React.useState("");
  const [updatingNote, setUpdatingNote] = React.useState(false);

  // New Note
  const [noteContent, setNoteContent] = React.useState("");
  const [submittingNote, setSubmittingNote] = React.useState(false);

  // Submissions map
  const mySubmissionMap = React.useMemo(() => {
    const map = new Map<string, Submission>();
    mySubmissions.forEach((s) => map.set(s.assignment_id, s));
    return map;
  }, [mySubmissions]);

  const totalLabs = assignments.length;
  const completedLabs = assignments.filter(
    (a) => mySubmissionMap.get(a.id)?.status === "accepted"
  ).length;

  // Handle upload syllabus (методичка курса)
  const handleUploadSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syllabusFile) return;
    setUploadingSyllabus(true);

    try {
      const supabase = createClient();
      const ext = syllabusFile.name.split(".").pop();
      const path = `syllabi/${subject.id}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(path, syllabusFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);

      await supabase
        .from("subjects")
        .update({
          syllabus_file_url: urlData.publicUrl,
          syllabus_filename: syllabusFile.name,
        })
        .eq("id", subject.id);

      setSyllabusModalOpen(false);
      setSyllabusFile(null);
      router.refresh();
    } catch (err: any) {
      alert(`Ошибка загрузки методички: ${err.message}`);
    } finally {
      setUploadingSyllabus(false);
    }
  };

  // Handle upload extra material
  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialFile || !materialTitle.trim()) return;
    setUploadingMaterial(true);

    try {
      const supabase = createClient();
      const ext = materialFile.name.split(".").pop();
      const path = `extra/${subject.id}/${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(path, materialFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);

      const { data: newMat, error: insertError } = await supabase
        .from("subject_materials")
        .insert({
          subject_id: subject.id,
          title: materialTitle.trim(),
          file_url: urlData.publicUrl,
          filename: materialFile.name,
          uploaded_by: profile.id,
        })
        .select("*, uploader:profiles(*)")
        .single();

      if (insertError) throw insertError;

      if (newMat) {
        setMaterials([newMat as SubjectMaterial, ...materials]);
      }

      setMaterialModalOpen(false);
      setMaterialTitle("");
      setMaterialFile(null);
    } catch (err: any) {
      alert(`Ошибка загрузки материала: ${err.message}`);
    } finally {
      setUploadingMaterial(false);
    }
  };

  // Handle delete extra material
  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm("Удалить этот дополнительный материал?")) return;
    const supabase = createClient();
    await supabase.from("subject_materials").delete().eq("id", materialId);
    setMaterials(materials.filter((m) => m.id !== materialId));
  };

  // Handle post note
  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setSubmittingNote(true);

    try {
      const supabase = createClient();
      const { data: newNote, error } = await supabase
        .from("subject_notes")
        .insert({
          subject_id: subject.id,
          content: noteContent.trim(),
          author_id: profile.id,
        })
        .select("*, author:profiles(*)")
        .single();

      if (error) throw error;

      if (newNote) {
        setNotes([newNote as SubjectNote, ...notes]);
      }
      setNoteContent("");
    } catch (err: any) {
      alert(`Ошибка добавления заметки: ${err.message}`);
    } finally {
      setSubmittingNote(false);
    }
  };

  // Handle delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Удалить эту заметку?")) return;
    const supabase = createClient();
    await supabase.from("subject_notes").delete().eq("id", noteId);
    setNotes(notes.filter((n) => n.id !== noteId));
  };

  // Handle delete assignment
  const handleDeleteAssignment = async (assignmentId: string, title: string) => {
    if (!confirm(`Удалить лабораторную работу «${title}»?`)) return;
    const supabase = createClient();
    await supabase.from("assignments").delete().eq("id", assignmentId);
    router.refresh();
  };

  // Handle save inline description
  const handleSaveDescription = async () => {
    setSavingDesc(true);
    try {
      const supabase = createClient();
      const cleanDesc = description.trim() || null;
      const { error } = await supabase
        .from("subjects")
        .update({ description: cleanDesc })
        .eq("id", subject.id);

      if (error) throw error;
      setIsEditingDesc(false);
      router.refresh();
    } catch (err: any) {
      alert(`Ошибка сохранения описания: ${err.message}`);
    } finally {
      setSavingDesc(false);
    }
  };

  // Handle delete syllabus (методичка курса)
  const handleDeleteSyllabus = async () => {
    if (!confirm("Удалить методичку этого предмета?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("subjects")
        .update({
          syllabus_file_url: null,
          syllabus_filename: null,
        })
        .eq("id", subject.id);

      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      alert(`Ошибка удаления методички: ${err.message}`);
    }
  };

  // Handle update extra material
  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial || !editMatTitle.trim()) return;
    setUpdatingMaterial(true);

    try {
      const supabase = createClient();
      let fileUrl = editingMaterial.file_url;
      let filename = editingMaterial.filename;

      if (editMatFile) {
        const ext = editMatFile.name.split(".").pop();
        const path = `extra/${subject.id}/${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(path, editMatFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        filename = editMatFile.name;
      }

      const { data: updated, error } = await supabase
        .from("subject_materials")
        .update({
          title: editMatTitle.trim(),
          file_url: fileUrl,
          filename: filename,
        })
        .eq("id", editingMaterial.id)
        .select("*, uploader:profiles(*)")
        .single();

      if (error) throw error;

      if (updated) {
        setMaterials(materials.map((m) => (m.id === editingMaterial.id ? (updated as SubjectMaterial) : m)));
      }
      setEditingMaterial(null);
      setEditMatFile(null);
    } catch (err: any) {
      alert(`Ошибка обновления материала: ${err.message}`);
    } finally {
      setUpdatingMaterial(false);
    }
  };

  // Handle update note
  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteText.trim()) return;
    setUpdatingNote(true);

    try {
      const supabase = createClient();
      const { data: updated, error } = await supabase
        .from("subject_notes")
        .update({
          content: editingNoteText.trim(),
        })
        .eq("id", noteId)
        .select("*, author:profiles(*)")
        .single();

      if (error) throw error;

      if (updated) {
        setNotes(notes.map((n) => (n.id === noteId ? (updated as SubjectNote) : n)));
      }
      setEditingNoteId(null);
    } catch (err: any) {
      alert(`Ошибка обновления заметки: ${err.message}`);
    } finally {
      setUpdatingNote(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb Back Link */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/subjects"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Все предметы
        </Link>

        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSubjectModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Редактировать предмет
          </Button>
        )}
      </div>

      {/* Main Subject Header Card */}
      <Card className="border-border/70 overflow-hidden shadow-sm">
        <div
          className="h-2.5 w-full"
          style={{ backgroundColor: subject.color_hex || "#3b82f6" }}
        />

        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: subject.color_hex || "#3b82f6" }}
                />
                <CardTitle className="text-2xl font-bold tracking-tight">
                  {subject.title}
                </CardTitle>
              </div>

              {subject.teacher_name && (
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{subject.teacher_name}</span>
                  {subject.teacher_contact && (
                    <span className="text-xs text-primary font-mono">({subject.teacher_contact})</span>
                  )}
                </p>
              )}
            </div>

            {/* Links */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {subject.moodle_url && (
                <a
                  href={subject.moodle_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent transition-colors border border-border"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Moodle
                </a>
              )}
              {subject.chat_url && (
                <a
                  href={subject.chat_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent transition-colors border border-border"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Чат группы
                </a>
              )}
            </div>
          </div>

          {/* Editable Description Section */}
          {isEditingDesc ? (
            <div className="mt-3 p-4 rounded-xl bg-card border border-primary/40 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold flex items-center gap-1.5 text-foreground">
                  <Edit2 className="h-3.5 w-3.5 text-primary" />
                  Описание предмета
                </span>
                <span className="text-muted-foreground text-[11px]">
                  Требования, критерии, ссылки
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Укажите описание предмета, критерии оценки или важные примечания для группы..."
                className="w-full rounded-lg border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary leading-relaxed"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={savingDesc}
                  onClick={() => {
                    setDescription(subject.description || "");
                    setIsEditingDesc(false);
                  }}
                  className="text-xs h-8"
                >
                  Отмена
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={savingDesc}
                  onClick={handleSaveDescription}
                  className="text-xs h-8 gap-1.5"
                >
                  {savingDesc ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Сохранить
                </Button>
              </div>
            </div>
          ) : description ? (
            <div className="group relative mt-3 p-4 rounded-xl bg-card/60 border border-border/60 text-sm leading-relaxed whitespace-pre-wrap">
              <div className="flex items-start justify-between gap-3">
                <div className="text-foreground/90 flex-1">{description}</div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingDesc(true)}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0 gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                    title="Редактировать описание предмета"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Изменить</span>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            isAdmin && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setIsEditingDesc(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary p-2 rounded-lg border border-dashed border-border hover:border-primary/50 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Добавить описание предмета
                </button>
              </div>
            )
          )}

          {/* Progress Bar */}
          <div className="pt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground font-medium">Мой прогресс сдачи лабораторных:</span>
              <span className="font-bold text-foreground">
                {completedLabs} из {totalLabs} сдано ({totalLabs > 0 ? Math.round((completedLabs / totalLabs) * 100) : 0}%)
              </span>
            </div>
            <Progress
              value={completedLabs}
              max={Math.max(1, totalLabs)}
              indicatorColor="bg-primary"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Course Syllabus Card (Методичка курса предмета) */}
      <Card className="border-border/70 shadow-sm bg-gradient-to-r from-card to-primary/5">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-base text-foreground">
                Методичка предмета
              </div>
              <p className="text-xs text-muted-foreground">
                {subject.syllabus_filename
                  ? `Файл: ${subject.syllabus_filename}`
                  : "Основное методическое пособие и программа курса"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {subject.syllabus_file_url ? (
              <a
                href={subject.syllabus_file_url}
                target="_blank"
                download
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-sm transition-colors"
              >
                <Download className="h-4 w-4" />
                Скачать методичку предмета
              </a>
            ) : (
              <span className="text-xs text-muted-foreground italic mr-2">
                Методичка еще не прикреплена
              </span>
            )}

            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSyllabusModalOpen(true)}
                  className="text-xs gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {subject.syllabus_file_url ? "Заменить" : "Загрузить методичку"}
                </Button>
                {subject.syllabus_file_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteSyllabus}
                    className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
                    title="Удалить методичку предмета"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assignments Section */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Лабораторные работы ({totalLabs})
              </CardTitle>
              <CardDescription>
                Список заданий, дедлайны и статус выполнения
              </CardDescription>
            </div>

            {isAdmin && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingAssignment(null);
                  setAssignmentModalOpen(true);
                }}
                className="gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Добавить работу
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-2.5 pt-0">
          {assignments.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground">
              В данном предмете пока нет лабораторных работ.
            </div>
          ) : (
            assignments.map((assignment) => {
              const mySub = mySubmissionMap.get(assignment.id);
              return (
                <div
                  key={assignment.id}
                  className="p-3.5 rounded-xl border border-border/60 bg-card/40 hover:bg-accent/40 transition-colors flex items-center justify-between gap-3 group"
                >
                  <Link
                    href={`/dashboard/assignments/${assignment.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
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
                        <span className="flex items-center gap-1 text-primary/90">
                          <Paperclip className="h-3 w-3" />
                          Файл задания
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    <LabStatusBadge status={mySub?.status || "not_started"} />

                    {isAdmin && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Редактировать лабораторную"
                          onClick={() => {
                            setEditingAssignment(assignment);
                            setAssignmentModalOpen(true);
                          }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Удалить лабораторную"
                          onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}

                    <Link
                      href={`/dashboard/assignments/${assignment.id}`}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Grid: Extra Materials (вне лаб) & Group Notes (заметки) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Extra Materials Card */}
        <Card className="border-border/70 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-primary" />
                Материалы вне лаб ({materials.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMaterialModalOpen(true)}
                className="text-xs gap-1 h-8"
              >
                <Upload className="h-3 w-3" />
                Прикрепить файл
              </Button>
            </div>
            <CardDescription className="text-xs">
              Лекции, шпаргалки, билеты к экзаменам и доп. литература
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2.5 flex-1">
            {materials.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                Дополнительные материалы еще не прикреплены.
              </div>
            ) : (
              materials.map((mat) => (
                <div
                  key={mat.id}
                  className="p-3 rounded-xl border border-border/60 bg-card/40 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-foreground truncate">
                      {mat.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5 truncate">
                      <span>{mat.uploader?.full_name || "Студент"}</span>
                      <span>•</span>
                      <span>{formatDate(mat.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={mat.file_url}
                      target="_blank"
                      download
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      Скачать
                    </a>

                    {(mat.uploaded_by === profile.id || isMainAdmin) && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingMaterial(mat);
                            setEditMatTitle(mat.title);
                            setEditMatFile(null);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                          title="Редактировать материал"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(mat.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                          title="Удалить файл"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Group Notes Card (текстовые заметки) */}
        <Card className="border-border/70 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Заметки группы к предмету
            </CardTitle>
            <CardDescription className="text-xs">
              Любой студент может оставить комментарий или подсказку по предмету
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
            {/* Notes List */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {notes.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Заметок пока нет. Напишите первую полезную подсказку сокурсникам!
                </div>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl border border-border/60 bg-card/40 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
                          {n.author?.full_name?.charAt(0) || "С"}
                        </div>
                        <span>{n.author?.full_name || "Студент"}</span>
                        {n.author?.email?.toLowerCase() === "hasleranet@gmail.com" ? (
                          <span className="text-[10px] text-amber-400 font-semibold">(Главный староста)</span>
                        ) : n.author?.role === "admin" ? (
                          <span className="text-[10px] text-blue-400 font-semibold">(Староста)</span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{formatDate(n.created_at)}</span>
                        {(n.author_id === profile.id || isMainAdmin) && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingNoteId(n.id);
                                setEditingNoteText(n.content);
                              }}
                              className="hover:text-primary transition-colors p-0.5"
                              title="Редактировать заметку"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(n.id)}
                              className="hover:text-destructive transition-colors p-0.5"
                              title="Удалить заметку"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {editingNoteId === n.id ? (
                      <div className="space-y-2 mt-1">
                        <textarea
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-primary/40 bg-background p-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary leading-relaxed"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[11px] px-2"
                            disabled={updatingNote}
                            onClick={() => setEditingNoteId(null)}
                          >
                            Отмена
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="h-6 text-[11px] px-2.5 gap-1"
                            disabled={updatingNote || !editingNoteText.trim()}
                            onClick={() => handleUpdateNote(n.id)}
                          >
                            {updatingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Сохранить
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {n.content}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Note Input Form */}
            <form onSubmit={handlePostNote} className="flex gap-2 pt-2 border-t border-border/40">
              <Input
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Оставить заметку для группы..."
                className="text-xs flex-1"
                required
              />
              <Button type="submit" size="sm" disabled={submittingNote} className="gap-1 text-xs shrink-0">
                {submittingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Отправить
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Upload Syllabus Modal */}
      <Dialog open={syllabusModalOpen} onOpenChange={setSyllabusModalOpen}>
        <DialogHeader>
          <DialogTitle>Методичка предмета</DialogTitle>
          <DialogDescription>
            Загрузите общее методическое руководство или программу курса
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUploadSyllabus} className="space-y-4">
          <div className="border border-dashed border-border rounded-xl p-4 text-center">
            <input
              type="file"
              id="syllabus-file-upload"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setSyllabusFile(e.target.files[0]);
              }}
              required
            />
            <label
              htmlFor="syllabus-file-upload"
              className="cursor-pointer flex flex-col items-center gap-2 text-xs text-muted-foreground"
            >
              <Upload className="h-6 w-6 text-primary" />
              {syllabusFile ? (
                <span className="font-semibold text-foreground">{syllabusFile.name}</span>
              ) : (
                <span>Выберите файл методички (PDF, DOCX, архивы)</span>
              )}
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSyllabusModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={uploadingSyllabus || !syllabusFile}>
              {uploadingSyllabus ? <Loader2 className="h-4 w-4 animate-spin" /> : "Загрузить"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Upload Extra Material Modal */}
      <Dialog open={materialModalOpen} onOpenChange={setMaterialModalOpen}>
        <DialogHeader>
          <DialogTitle>Прикрепить материал к предмету</DialogTitle>
          <DialogDescription>
            Загрузите файлы лекций, шпаргалок или примеров для всей группы
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUploadMaterial} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Название материала *</label>
            <Input
              value={materialTitle}
              onChange={(e) => setMaterialTitle(e.target.value)}
              placeholder="Например: Вопросы к экзамену 2026"
              required
              className="text-xs"
            />
          </div>
          <div className="border border-dashed border-border rounded-xl p-4 text-center">
            <input
              type="file"
              id="extra-file-upload"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setMaterialFile(e.target.files[0]);
              }}
              required
            />
            <label
              htmlFor="extra-file-upload"
              className="cursor-pointer flex flex-col items-center gap-2 text-xs text-muted-foreground"
            >
              <Upload className="h-5 w-5 text-primary" />
              {materialFile ? (
                <span className="font-semibold text-foreground">{materialFile.name}</span>
              ) : (
                <span>Выберите файл (до 50 МБ)</span>
              )}
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMaterialModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={uploadingMaterial || !materialFile || !materialTitle.trim()}>
              {uploadingMaterial ? <Loader2 className="h-4 w-4 animate-spin" /> : "Загрузить"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Extra Material Modal */}
      <Dialog
        open={!!editingMaterial}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMaterial(null);
            setEditMatFile(null);
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Редактировать полезный материал</DialogTitle>
          <DialogDescription>
            Измените название материала или загрузите новый файл на замену
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdateMaterial} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Название материала *</label>
            <Input
              value={editMatTitle}
              onChange={(e) => setEditMatTitle(e.target.value)}
              placeholder="Например: Вопросы к экзамену 2026"
              required
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Текущий файл</label>
            <div className="p-2.5 rounded-lg border border-border/70 bg-secondary/30 text-xs flex items-center justify-between">
              <span className="truncate font-medium">{editingMaterial?.filename}</span>
              <span className="text-[10px] text-muted-foreground">Прикреплен</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Заменить файл (необязательно)</label>
            <div className="border border-dashed border-border rounded-xl p-4 text-center">
              <input
                type="file"
                id="edit-extra-file-upload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setEditMatFile(e.target.files[0]);
                }}
              />
              {editMatFile ? (
                <div className="flex items-center justify-center gap-2 text-xs">
                  <Upload className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold text-foreground truncate max-w-[280px]">
                    {editMatFile.name} ({(editMatFile.size / 1024 / 1024).toFixed(2)} МБ)
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditMatFile(null);
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive rounded"
                    title="Отменить выбор файла"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="edit-extra-file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2 text-xs text-muted-foreground"
                >
                  <Upload className="h-5 w-5 text-primary" />
                  <span>Нажмите для выбора нового файла на замену</span>
                </label>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingMaterial(null);
                setEditMatFile(null);
              }}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={updatingMaterial || !editMatTitle.trim()}
            >
              {updatingMaterial ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Assignment Modal */}
      <AssignmentModal
        open={assignmentModalOpen}
        onOpenChange={setAssignmentModalOpen}
        subjectId={subject.id}
        assignmentToEdit={editingAssignment}
      />

      {/* Subject Edit Modal */}
      <SubjectModal
        open={subjectModalOpen}
        onOpenChange={setSubjectModalOpen}
        semesterId={subject.semester_id}
        subjectToEdit={subject}
      />
    </div>
  );
}
