"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { CalendarEvent, EventType } from "@/types/database";

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterId: string;
  eventToEdit?: CalendarEvent | null;
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "test", label: "🟣 Контрольная работа / Тест" },
  { value: "colloquium", label: "🟠 Коллоквиум / Защита" },
  { value: "exam", label: "🔵 Экзамен / Зачет" },
  { value: "consultation", label: "🟢 Консультация" },
  { value: "other", label: "⚪ Другое событие" },
];

export function EventModal({
  open,
  onOpenChange,
  semesterId,
  eventToEdit,
}: EventModalProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [eventType, setEventType] = React.useState<EventType>("test");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setEventType(eventToEdit.event_type);
      const formatDT = (iso?: string | null) => {
        if (!iso) return "";
        const d = new Date(iso);
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      setStartTime(formatDT(eventToEdit.start_time));
      setEndTime(formatDT(eventToEdit.end_time));
      setDescription(eventToEdit.description || "");
    } else {
      setTitle("");
      setEventType("test");
      setStartTime("");
      setEndTime("");
      setDescription("");
    }
  }, [eventToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!eventToEdit && (!semesterId || semesterId.trim() === "")) {
        setError("Семестр не выбран. Пожалуйста, сначала создайте семестр в панели предметов.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const isoStart = new Date(startTime).toISOString();
      const isoEnd = endTime ? new Date(endTime).toISOString() : null;

      if (eventToEdit) {
        const { error: updateError } = await supabase
          .from("calendar_events")
          .update({
            title,
            event_type: eventType,
            start_time: isoStart,
            end_time: isoEnd,
            description: description || null,
          })
          .eq("id", eventToEdit.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("calendar_events").insert({
          semester_id: semesterId,
          title,
          event_type: eventType,
          start_time: isoStart,
          end_time: isoEnd,
          description: description || null,
        });

        if (insertError) throw insertError;
      }

      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ошибка сохранения события");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>
          {eventToEdit ? "Редактировать событие" : "Добавить событие в календарь"}
        </DialogTitle>
        <DialogDescription>
          Событие увидят все участники группы в общем академическом календаре
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Название события *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Рубежный тест по СУБД"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Тип события</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
            className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Дата и время начала *</label>
            <Input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Время окончания</label>
            <Input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Описание / Аудитория / Ссылка</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Ауд. 402, или ссылка на онлайн-конференцию..."
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
