"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { Assignment } from "@/types/database";

interface AssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  assignmentToEdit?: Assignment | null;
}

export function AssignmentModal({
  open,
  onOpenChange,
  subjectId,
  assignmentToEdit,
}: AssignmentModalProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [deadline, setDeadline] = React.useState("");
  const [tagInput, setTagInput] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [currentFileUrl, setCurrentFileUrl] = React.useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (assignmentToEdit) {
      setTitle(assignmentToEdit.title);
      setDescription(assignmentToEdit.description || "");
      if (assignmentToEdit.deadline) {
        // Format for datetime-local: YYYY-MM-DDTHH:mm
        const d = new Date(assignmentToEdit.deadline);
        const pad = (n: number) => n.toString().padStart(2, "0");
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDeadline(formatted);
      } else {
        setDeadline("");
      }
      setTags(assignmentToEdit.tags || []);
      setCurrentFileUrl(assignmentToEdit.material_file_url || null);
      setCurrentFileName(assignmentToEdit.material_filename || null);
    } else {
      setTitle("");
      setDescription("");
      setDeadline("");
      setTags(["Лабораторная"]);
      setCurrentFileUrl(null);
      setCurrentFileName(null);
    }
    setSelectedFile(null);
  }, [assignmentToEdit, open]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let fileUrl = currentFileUrl;
      let fileName = currentFileName;

      // Upload file to Supabase Storage `materials` bucket if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `materials/${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, selectedFile, {
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Ошибка загрузки методички: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("materials")
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = selectedFile.name;
      }

      const isoDeadline = deadline ? new Date(deadline).toISOString() : null;

      if (assignmentToEdit) {
        const { error: updateError } = await supabase
          .from("assignments")
          .update({
            title,
            description: description || null,
            deadline: isoDeadline,
            tags,
            material_file_url: fileUrl,
            material_filename: fileName,
          })
          .eq("id", assignmentToEdit.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("assignments").insert({
          subject_id: subjectId,
          title,
          description: description || null,
          deadline: isoDeadline,
          tags,
          material_file_url: fileUrl,
          material_filename: fileName,
        });

        if (insertError) throw insertError;
      }

      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ошибка сохранения лабораторной");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>
          {assignmentToEdit ? "Редактировать лабораторную" : "Добавить лабораторную работу"}
        </DialogTitle>
        <DialogDescription>
          Укажите название, дедлайн, теги и прикрепите файл методички
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Название работы *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Лабораторная работа №1. Проектирование схемы БД"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Дедлайн сдачи</label>
          <Input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Теги</label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Добавить тег (например: SQL, Отчет)"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={handleAddTag}>
              +
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* File Upload (Material) */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Методичка / Условие задачи</label>
          {currentFileName && !selectedFile && (
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-secondary/30 text-xs mb-2">
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{currentFileName}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => {
                  setCurrentFileUrl(null);
                  setCurrentFileName(null);
                }}
              >
                Заменить
              </Button>
            </div>
          )}

          <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              id="material-file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
            <label
              htmlFor="material-file"
              className="cursor-pointer flex flex-col items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Upload className="h-6 w-6 text-primary mb-1" />
              {selectedFile ? (
                <span className="font-semibold text-foreground">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} МБ)</span>
              ) : (
                <>
                  <span className="font-semibold text-foreground">Нажмите для загрузки файла</span>
                  <span>PDF, DOCX, ZIP, архивы до 50 МБ</span>
                </>
              )}
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Подробное описание и требования</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Требования к оформлению отчета, ссылки на примеры..."
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
