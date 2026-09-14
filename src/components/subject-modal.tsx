"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { Subject, Semester } from "@/types/database";

interface SubjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterId: string;
  semesters?: Semester[];
  subjectToEdit?: Subject | null;
}

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
];

export function SubjectModal({
  open,
  onOpenChange,
  semesterId,
  semesters,
  subjectToEdit,
}: SubjectModalProps) {
  const router = useRouter();
  const [currentSemId, setCurrentSemId] = React.useState(semesterId);
  const [title, setTitle] = React.useState("");
  const [teacherName, setTeacherName] = React.useState("");
  const [teacherContact, setTeacherContact] = React.useState("");
  const [moodleUrl, setMoodleUrl] = React.useState("");
  const [chatUrl, setChatUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [colorHex, setColorHex] = React.useState(PRESET_COLORS[0]);
  const [syllabusFile, setSyllabusFile] = React.useState<File | null>(null);
  const [currentSyllabusUrl, setCurrentSyllabusUrl] = React.useState<string | null>(null);
  const [currentSyllabusName, setCurrentSyllabusName] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCurrentSemId(semesterId || semesters?.[0]?.id || "");
  }, [semesterId, semesters, open]);

  React.useEffect(() => {
    if (subjectToEdit) {
      setTitle(subjectToEdit.title);
      setTeacherName(subjectToEdit.teacher_name || "");
      setTeacherContact(subjectToEdit.teacher_contact || "");
      setMoodleUrl(subjectToEdit.moodle_url || "");
      setChatUrl(subjectToEdit.chat_url || "");
      setDescription(subjectToEdit.description || "");
      setColorHex(subjectToEdit.color_hex || PRESET_COLORS[0]);
      setCurrentSyllabusUrl(subjectToEdit.syllabus_file_url || null);
      setCurrentSyllabusName(subjectToEdit.syllabus_filename || null);
    } else {
      setTitle("");
      setTeacherName("");
      setTeacherContact("");
      setMoodleUrl("");
      setChatUrl("");
      setDescription("");
      setColorHex(PRESET_COLORS[0]);
      setCurrentSyllabusUrl(null);
      setCurrentSyllabusName(null);
    }
    setSyllabusFile(null);
  }, [subjectToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const cleanMoodle = moodleUrl.trim()
        ? (moodleUrl.trim().startsWith("http://") || moodleUrl.trim().startsWith("https://")
            ? moodleUrl.trim()
            : `https://${moodleUrl.trim()}`)
        : null;

      const cleanChat = chatUrl.trim()
        ? (chatUrl.trim().startsWith("http://") || chatUrl.trim().startsWith("https://")
            ? chatUrl.trim()
            : `https://${chatUrl.trim()}`)
        : null;

      const targetSemId = currentSemId || semesterId;
      if (!targetSemId || targetSemId.trim() === "") {
        setError("Учебный семестр не выбран. Пожалуйста, сначала создайте семестр (кнопка «+ Семестр»).");
        setLoading(false);
        return;
      }

      let syllabusUrl = currentSyllabusUrl;
      let syllabusName = currentSyllabusName;

      if (syllabusFile) {
        const ext = syllabusFile.name.split(".").pop();
        const safeName = `syllabus_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
        const path = `syllabi/${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(path, syllabusFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);
        syllabusUrl = urlData.publicUrl;
        syllabusName = syllabusFile.name;
      }

      if (subjectToEdit) {
        const { error: updateError } = await supabase
          .from("subjects")
          .update({
            title: title.trim(),
            teacher_name: teacherName.trim() || null,
            teacher_contact: teacherContact.trim() || null,
            moodle_url: cleanMoodle,
            chat_url: cleanChat,
            description: description.trim() || null,
            color_hex: colorHex,
            syllabus_file_url: syllabusUrl,
            syllabus_filename: syllabusName,
          })
          .eq("id", subjectToEdit.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("subjects").insert({
          semester_id: targetSemId,
          title: title.trim(),
          teacher_name: teacherName.trim() || null,
          teacher_contact: teacherContact.trim() || null,
          moodle_url: cleanMoodle,
          chat_url: cleanChat,
          description: description.trim() || null,
          color_hex: colorHex,
          syllabus_file_url: syllabusUrl,
          syllabus_filename: syllabusName,
        });

        if (insertError) throw insertError;
      }

      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ошибка сохранения предмета");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>
          {subjectToEdit ? "Редактировать предмет" : "Добавить предмет"}
        </DialogTitle>
        <DialogDescription>
          Заполните данные дисциплины, контакты преподавателя и полезные ссылки
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}

        {semesters && semesters.length > 0 ? (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Семестр *</label>
            <select
              value={currentSemId}
              onChange={(e) => setCurrentSemId(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_active ? "(текущий)" : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
            ⚠️ Семестры еще не созданы. Пожалуйста, сначала закройте это окно и нажмите кнопку «+ Семестр».
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Название дисциплины *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Архитектура вычислительных систем"
            required
          />
        </div>

        {/* Color Picker */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Цветовой акцент предмета</label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map((color) => (
              <button
                type="button"
                key={color}
                onClick={() => setColorHex(color)}
                className={`h-7 w-7 rounded-full transition-transform ${
                  colorHex === color ? "scale-125 ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-110"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Преподаватель <span className="text-xs text-muted-foreground font-normal">(опционально)</span></label>
            <Input
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="ФИО преподавателя"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Контакты препода <span className="text-xs text-muted-foreground font-normal">(опционально)</span></label>
            <Input
              value={teacherContact}
              onChange={(e) => setTeacherContact(e.target.value)}
              placeholder="Telegram, email или телефон"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ссылка на Moodle <span className="text-xs text-muted-foreground font-normal">(опционально)</span></label>
            <Input
              type="text"
              value={moodleUrl}
              onChange={(e) => setMoodleUrl(e.target.value)}
              placeholder="https://moodle.university.ru/..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ссылка на беседу / чат <span className="text-xs text-muted-foreground font-normal">(опционально)</span></label>
            <Input
              type="text"
              value={chatUrl}
              onChange={(e) => setChatUrl(e.target.value)}
              placeholder="https://t.me/... (если есть)"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Краткое описание / Заметки <span className="text-xs text-muted-foreground font-normal">(опционально)</span></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Требования к зачету, критерии оценивания или ссылка на диск..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Course Syllabus Upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Общая методичка предмета <span className="text-xs text-muted-foreground font-normal">(опционально)</span>
          </label>
          {currentSyllabusName && !syllabusFile && (
            <div className="p-2 rounded-lg bg-secondary/50 border border-border text-xs flex items-center justify-between">
              <span className="truncate">Прикреплен файл: {currentSyllabusName}</span>
              <button
                type="button"
                onClick={() => {
                  setCurrentSyllabusUrl(null);
                  setCurrentSyllabusName(null);
                }}
                className="text-xs text-destructive hover:underline ml-2"
              >
                Удалить
              </button>
            </div>
          )}
          <Input
            type="file"
            onChange={(e) => {
              if (e.target.files?.[0]) setSyllabusFile(e.target.files[0]);
            }}
            className="text-xs"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
