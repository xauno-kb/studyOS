"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { Subject } from "@/types/database";

interface SubjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterId: string;
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
  subjectToEdit,
}: SubjectModalProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [teacherName, setTeacherName] = React.useState("");
  const [teacherContact, setTeacherContact] = React.useState("");
  const [moodleUrl, setMoodleUrl] = React.useState("");
  const [chatUrl, setChatUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [colorHex, setColorHex] = React.useState(PRESET_COLORS[0]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (subjectToEdit) {
      setTitle(subjectToEdit.title);
      setTeacherName(subjectToEdit.teacher_name || "");
      setTeacherContact(subjectToEdit.teacher_contact || "");
      setMoodleUrl(subjectToEdit.moodle_url || "");
      setChatUrl(subjectToEdit.chat_url || "");
      setDescription(subjectToEdit.description || "");
      setColorHex(subjectToEdit.color_hex || PRESET_COLORS[0]);
    } else {
      setTitle("");
      setTeacherName("");
      setTeacherContact("");
      setMoodleUrl("");
      setChatUrl("");
      setDescription("");
      setColorHex(PRESET_COLORS[0]);
    }
  }, [subjectToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (subjectToEdit) {
        const { error: updateError } = await supabase
          .from("subjects")
          .update({
            title,
            teacher_name: teacherName || null,
            teacher_contact: teacherContact || null,
            moodle_url: moodleUrl || null,
            chat_url: chatUrl || null,
            description: description || null,
            color_hex: colorHex,
          })
          .eq("id", subjectToEdit.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("subjects").insert({
          semester_id: semesterId,
          title,
          teacher_name: teacherName || null,
          teacher_contact: teacherContact || null,
          moodle_url: moodleUrl || null,
          chat_url: chatUrl || null,
          description: description || null,
          color_hex: colorHex,
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
            <label className="text-sm font-medium">Преподаватель</label>
            <Input
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="ФИО преподавателя"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Контакты препода</label>
            <Input
              value={teacherContact}
              onChange={(e) => setTeacherContact(e.target.value)}
              placeholder="Telegram, email или телефон"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ссылка на Moodle</label>
            <Input
              type="url"
              value={moodleUrl}
              onChange={(e) => setMoodleUrl(e.target.value)}
              placeholder="https://moodle.university.ru/..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ссылка на беседу / чат</label>
            <Input
              type="url"
              value={chatUrl}
              onChange={(e) => setChatUrl(e.target.value)}
              placeholder="https://t.me/joinchat/..."
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Краткое описание / Заметки</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Требования к зачету, критерии оценивания или ссылка на диск..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
