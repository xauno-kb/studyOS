"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Profile,
  Assignment,
  Submission,
  LabStatus,
} from "@/types/database";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LabStatusBadge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  Download,
  Upload,
  ExternalLink,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  Save,
  Loader2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AssignmentDetailViewProps {
  profile: Profile;
  assignment: Assignment;
  mySubmission: Submission | null;
  groupSubmissions: Submission[];
}

const STATUS_OPTIONS: { value: LabStatus; label: string; icon: string }[] = [
  { value: "not_started", label: "Не начато", icon: "⚪" },
  { value: "in_progress", label: "В процессе выполнения", icon: "🟡" },
  { value: "review_pending", label: "Ждет проверки преподавателем", icon: "🔵" },
  { value: "accepted", label: "Зачтено / Сдано", icon: "🟢" },
  { value: "revision_needed", label: "На доработке", icon: "🔴" },
];

export function AssignmentDetailView({
  profile,
  assignment,
  mySubmission,
  groupSubmissions,
}: AssignmentDetailViewProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState<LabStatus>(
    mySubmission?.status || "not_started"
  );
  const [externalLink, setExternalLink] = React.useState(
    mySubmission?.external_link || ""
  );
  const [notes, setNotes] = React.useState(mySubmission?.notes || "");
  const [file, setFile] = React.useState<File | null>(null);
  const [currentFileUrl, setCurrentFileUrl] = React.useState<string | null>(
    mySubmission?.file_url || null
  );
  const [currentFileName, setCurrentFileName] = React.useState<string | null>(
    mySubmission?.filename || null
  );

  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Countdown timer calculation
  const [timeLeft, setTimeLeft] = React.useState<string>("");

  React.useEffect(() => {
    if (!assignment.deadline) return;

    const calculateTime = () => {
      const diff = new Date(assignment.deadline!).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft("Срок сдачи истек");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      setTimeLeft(`${days} дн. ${hours} ч. ${minutes} мин.`);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, [assignment.deadline]);

  // Handle Save Submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const supabase = createClient();
      let fileUrl = currentFileUrl;
      let filename = currentFileName;

      // Upload file to Supabase Storage `submissions` bucket
      if (file) {
        const fileExt = file.name.split(".").pop();
        const safeName = `${profile.id}_${assignment.id}_${Date.now()}.${fileExt}`;
        const filePath = `${profile.id}/${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("submissions")
          .upload(filePath, file, {
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Ошибка загрузки файла решения: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("submissions")
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        filename = file.name;
        setCurrentFileUrl(fileUrl);
        setCurrentFileName(filename);
      }

      const cleanExternalLink = externalLink.trim()
        ? (externalLink.trim().startsWith("http://") || externalLink.trim().startsWith("https://")
            ? externalLink.trim()
            : `https://${externalLink.trim()}`)
        : null;

      // Upsert submission
      const { error: upsertError } = await supabase
        .from("submissions")
        .upsert(
          {
            assignment_id: assignment.id,
            user_id: profile.id,
            status,
            file_url: fileUrl,
            filename: filename,
            external_link: cleanExternalLink,
            notes: notes.trim() || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "assignment_id,user_id" }
        );

      if (upsertError) throw upsertError;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ошибка при сохранении решения");
    } finally {
      setSaving(false);
    }
  };

  const isOverdue =
    assignment.deadline &&
    new Date(assignment.deadline).getTime() < new Date().getTime() &&
    status !== "accepted";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button and Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/subjects"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к предметам
        </Link>
      </div>

      {/* Main Task Card */}
      <Card className="border-border/70 shadow-sm overflow-hidden">
        {assignment.subject?.color_hex && (
          <div
            className="h-2 w-full"
            style={{ backgroundColor: assignment.subject.color_hex }}
          />
        )}
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              {assignment.subject && (
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 inline-block"
                  style={{
                    backgroundColor: `${assignment.subject.color_hex || "#3b82f6"}20`,
                    color: assignment.subject.color_hex || "#3b82f6",
                  }}
                >
                  {assignment.subject.title}
                </span>
              )}
              <CardTitle className="text-2xl font-bold mt-1">
                {assignment.title}
              </CardTitle>
            </div>

            {/* Deadline Countdown */}
            {assignment.deadline && (
              <div
                className={`p-3 rounded-xl border text-right shrink-0 ${
                  isOverdue
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-card border-border/70"
                }`}
              >
                <div className="text-[11px] text-muted-foreground flex items-center justify-end gap-1">
                  <Clock className="h-3 w-3" />
                  Дедлайн: {formatDate(assignment.deadline)}
                </div>
                <div className="text-xs font-bold mt-0.5">
                  {isOverdue ? (
                    <span className="flex items-center justify-end gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Срок сдачи прошел!
                    </span>
                  ) : (
                    <span>Осталось: {timeLeft}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {assignment.tags && assignment.tags.length > 0 && (
            <div className="flex items-center gap-1.5 pt-2 flex-wrap">
              {assignment.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          {assignment.description && (
            <div className="p-4 rounded-xl bg-card/60 border border-border/60 text-sm leading-relaxed whitespace-pre-wrap">
              {assignment.description}
            </div>
          )}

          {/* Material File Download */}
          {assignment.material_file_url ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">
                    {assignment.material_filename || "Методические указания"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Оригинальный файл задания от преподавателя
                  </div>
                </div>
              </div>

              <a
                href={assignment.material_file_url}
                target="_blank"
                download
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-sm transition-colors"
              >
                <Download className="h-4 w-4" />
                Скачать методичку
              </a>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">
              Методический файл к данной работе не прикреплен.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid: My Submission & Group Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Submission Box */}
        <Card className="border-border/70 shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Мое решение
              </CardTitle>
              <LabStatusBadge status={status} />
            </div>
            <CardDescription>
              Управляйте личным статусом выполнения и прикрепите файлы отчета/кода
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSave}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                  {error}
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Статус и решение успешно сохранены!</span>
                </div>
              )}

              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Текущий статус
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setStatus(opt.value)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                        status === opt.value
                          ? "bg-primary/10 border-primary text-foreground shadow-sm"
                          : "bg-card border-border/60 hover:bg-accent/50 text-muted-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </span>
                      {status === opt.value && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload solution file */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Файл решения (ZIP, PDF, DOCX, код)
                </label>

                {currentFileName && !file && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-secondary/30 text-xs mb-2">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{currentFileName}</span>
                    </div>
                    {currentFileUrl && (
                      <a
                        href={currentFileUrl}
                        target="_blank"
                        download
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Скачать
                      </a>
                    )}
                  </div>
                )}

                <div className="border border-dashed border-border rounded-xl p-3 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="solution-file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setFile(e.target.files[0]);
                    }}
                  />
                  <label
                    htmlFor="solution-file"
                    className="cursor-pointer flex items-center justify-center gap-2 text-xs text-muted-foreground"
                  >
                    <Upload className="h-4 w-4 text-primary" />
                    {file ? (
                      <span className="font-semibold text-foreground truncate max-w-xs">
                        {file.name}
                      </span>
                    ) : (
                      <span>{currentFileName ? "Перезалить новый файл" : "Прикрепить файл отчета/кода"}</span>
                    )}
                  </label>
                </div>
              </div>

              {/* External Repo / Drive Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ссылка на репозиторий GitHub или диск <span className="text-[11px] opacity-70">(опционально)</span>
                </label>
                <Input
                  type="text"
                  placeholder="https://github.com/username/project"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Заметки к сдаче (опционально)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Особенности сборки, номер варианта, замечания препода..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button type="submit" className="w-full gap-2 text-xs" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Сохраняем...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Сохранить изменения
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Group Solutions Section */}
        <Card className="border-border/70 shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Решения сокурсников ({groupSubmissions.length})
              </CardTitle>
            </div>
            <CardDescription>
              Свободный академический обмен решениями внутри группы для взаимопомощи
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 flex-1">
            {groupSubmissions.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                Сокурсники еще не загрузили свои решения для этой лабораторной.
              </div>
            ) : (
              groupSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-xl border border-border/60 bg-card/40 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
                        {sub.profile?.full_name?.charAt(0) || "С"}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-foreground">
                          {sub.profile?.full_name || "Студент"}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {formatDate(sub.updated_at)}
                        </div>
                      </div>
                    </div>

                    <LabStatusBadge status={sub.status} />
                  </div>

                  {/* Notes if any */}
                  {sub.notes && (
                    <div className="text-xs text-muted-foreground bg-accent/30 p-2 rounded-lg">
                      «{sub.notes}»
                    </div>
                  )}

                  {/* Links and files */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {sub.file_url && (
                      <a
                        href={sub.file_url}
                        target="_blank"
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Скачать ({sub.filename || "решение"})
                      </a>
                    )}

                    {sub.external_link && (
                      <a
                        href={sub.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-medium transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Репозиторий / Диск
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
