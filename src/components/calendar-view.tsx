"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Profile,
  Semester,
  CalendarEvent,
  Assignment,
} from "@/types/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventTypeBadge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EventModal } from "@/components/event-modal";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  ExternalLink,
  Trash2,
  Edit2,
  Sparkles,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { ru } from "date-fns/locale";

interface CalendarViewProps {
  profile: Profile;
  semester: Semester | null;
  events: CalendarEvent[];
  assignments: Assignment[];
}

export function CalendarView({
  profile,
  semester,
  events,
  assignments,
}: CalendarViewProps) {
  const router = useRouter();
  const isAdmin = profile.role === "admin";

  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<"month" | "week">("month");

  // Event modal state
  const [eventModalOpen, setEventModalOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<CalendarEvent | null>(null);

  // Detail modal state
  const [selectedItem, setSelectedItem] = React.useState<{
    type: "event" | "deadline";
    title: string;
    date: Date;
    description?: string | null;
    eventType?: string;
    url?: string;
    eventObj?: CalendarEvent;
  } | null>(null);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") setCurrentDate((d) => subMonths(d, 1));
    else setCurrentDate((d) => subWeeks(d, 1));
  };

  const handleNext = () => {
    if (viewMode === "month") setCurrentDate((d) => addMonths(d, 1));
    else setCurrentDate((d) => addWeeks(d, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  // Generate calendar days
  const calendarDays = React.useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, viewMode]);

  // Combine manual events and assignment deadlines into daily map
  const itemsByDay = React.useMemo(() => {
    const map = new Map<
      string,
      Array<{
        id: string;
        title: string;
        time: Date;
        type: "deadline" | "event";
        eventType?: any;
        color?: string;
        assignmentId?: string;
        rawEvent?: CalendarEvent;
      }>
    >();

    // 1. Assignment deadlines
    assignments.forEach((a) => {
      if (!a.deadline) return;
      const d = parseISO(a.deadline);
      const key = format(d, "yyyy-MM-dd");
      const list = map.get(key) || [];
      list.push({
        id: `deadline_${a.id}`,
        title: `Дедлайн: ${a.title}`,
        time: d,
        type: "deadline",
        eventType: "deadline",
        color: a.subject?.color_hex || "#ef4444",
        assignmentId: a.id,
      });
      map.set(key, list);
    });

    // 2. Manual events
    events.forEach((e) => {
      const d = parseISO(e.start_time);
      const key = format(d, "yyyy-MM-dd");
      const list = map.get(key) || [];
      list.push({
        id: `event_${e.id}`,
        title: e.title,
        time: d,
        type: "event",
        eventType: e.event_type,
        rawEvent: e,
      });
      map.set(key, list);
    });

    return map;
  }, [assignments, events]);

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Удалить это событие из календаря?")) return;
    const supabase = createClient();
    await supabase.from("calendar_events").delete().eq("id", eventId);
    setSelectedItem(null);
    router.refresh();
  };

  const weekDayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Академический календарь</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Дедлайны лабораторных работ, контрольные, зачеты и экзамены группы
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Toggle */}
          <div className="bg-card border border-border/70 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "month"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "week"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Неделя
            </button>
          </div>

          {/* Add Event Button for Admin */}
          {isAdmin && semester && (
            <Button
              onClick={() => {
                setEditingEvent(null);
                setEventModalOpen(true);
              }}
              size="sm"
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить событие
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Controls Bar */}
      <Card className="border-border/60">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold capitalize text-foreground min-w-[180px]">
              {format(currentDate, "LLLL yyyy", { locale: ru })}
            </h2>
            <Button variant="outline" size="sm" onClick={handleToday} className="text-xs h-8">
              Сегодня
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 pb-3 flex items-center gap-3 text-xs flex-wrap border-t border-border/40 pt-3">
          <span className="text-muted-foreground">Легенда:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>Дедлайн лабы</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            <span>Тест / КР</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span>Коллоквиум</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Экзамен / Зачет</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            <span>Консультация</span>
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="border-t border-border/60">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border/60 bg-muted/40 text-center py-2.5 text-xs font-semibold text-muted-foreground">
            {weekDayNames.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayItems = itemsByDay.get(dateKey) || [];
              const isCurrMonth = isSameMonth(day, currentDate);
              const isCurrDay = isToday(day);

              return (
                <div
                  key={dateKey}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                    !isCurrMonth && viewMode === "month"
                      ? "bg-muted/10 text-muted-foreground/40"
                      : "bg-card/40"
                  } ${isCurrDay ? "ring-1 ring-inset ring-primary bg-primary/5" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold h-6 w-6 rounded-full flex items-center justify-center ${
                        isCurrDay
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-foreground"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {dayItems.length > 0 && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {dayItems.length} соб.
                      </span>
                    )}
                  </div>

                  {/* Items for this day */}
                  <div className="space-y-1 overflow-y-auto max-h-[80px]">
                    {dayItems.map((item) => {
                      const isDeadline = item.type === "deadline";

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (isDeadline && item.assignmentId) {
                              router.push(`/dashboard/assignments/${item.assignmentId}`);
                            } else if (item.rawEvent) {
                              setSelectedItem({
                                type: "event",
                                title: item.rawEvent.title,
                                date: item.time,
                                description: item.rawEvent.description,
                                eventType: item.rawEvent.event_type,
                                eventObj: item.rawEvent,
                              });
                            }
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-[11px] font-medium truncate block transition-all hover:scale-[1.02] shadow-sm ${
                            isDeadline
                              ? "bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25"
                              : item.eventType === "test"
                              ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                              : item.eventType === "colloquium"
                              ? "bg-orange-500/15 text-orange-300 border border-orange-500/30"
                              : item.eventType === "exam"
                              ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                              : "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                          }`}
                          title={item.title}
                        >
                          <span className="font-semibold mr-1">
                            {format(item.time, "HH:mm")}
                          </span>
                          <span>{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Selected Event Details Modal */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              {selectedItem.eventType && (
                <EventTypeBadge type={selectedItem.eventType as any} />
              )}
            </div>
            <DialogTitle className="text-lg">{selectedItem.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {format(selectedItem.date, "d MMMM yyyy, HH:mm", { locale: ru })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            {selectedItem.description && (
              <div className="p-3 rounded-xl bg-card border border-border/70 text-xs leading-relaxed whitespace-pre-wrap">
                {selectedItem.description}
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
            {isAdmin && selectedItem.eventObj && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => handleDeleteEvent(selectedItem.eventObj!.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Удалить событие
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedItem(null)}
              className="text-xs"
            >
              Закрыть
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* Admin Event Creation Modal */}
      {semester && (
        <EventModal
          open={eventModalOpen}
          onOpenChange={setEventModalOpen}
          semesterId={semester.id}
          eventToEdit={editingEvent}
        />
      )}
    </div>
  );
}
