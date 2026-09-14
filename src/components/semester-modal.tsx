"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { Semester } from "@/types/database";

interface SemesterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterToEdit?: Semester | null;
}

export function SemesterModal({
  open,
  onOpenChange,
  semesterToEdit,
}: SemesterModalProps) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (semesterToEdit) {
      setName(semesterToEdit.name);
      setStartDate(semesterToEdit.start_date || "");
      setEndDate(semesterToEdit.end_date || "");
      setIsActive(semesterToEdit.is_active);
    } else {
      setName("");
      setStartDate("");
      setEndDate("");
      setIsActive(true);
    }
  }, [semesterToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (semesterToEdit) {
        const { error: updateError } = await supabase
          .from("semesters")
          .update({
            name,
            start_date: startDate || null,
            end_date: endDate || null,
            is_active: isActive,
          })
          .eq("id", semesterToEdit.id);

        if (updateError) throw updateError;
      } else {
        // If this is set as active, deactivate other semesters
        if (isActive) {
          await supabase.from("semesters").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
        }

        const { error: insertError } = await supabase.from("semesters").insert({
          name,
          start_date: startDate || null,
          end_date: endDate || null,
          is_active: isActive,
        });

        if (insertError) throw insertError;
      }

      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ошибка сохранения семестра");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>
          {semesterToEdit ? "Редактировать семестр" : "Новый семестр"}
        </DialogTitle>
        <DialogDescription>
          Укажите название учебного семестра (например: «3 курс, 1 семестр»)
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Название семестра</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: 3 курс, 1 семестр"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Дата начала</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Дата окончания</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="is_active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="is_active" className="text-sm cursor-pointer select-none">
            Сделать текущим активным семестром
          </label>
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
