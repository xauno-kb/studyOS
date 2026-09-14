import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/calendar-view";
import {
  Profile,
  Semester,
  CalendarEvent,
  Assignment,
} from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Active Semester
  const { data: semesters } = await supabase
    .from("semesters")
    .select("*")
    .order("created_at", { ascending: false });

  const activeSemester = semesters?.find((s) => s.is_active) || semesters?.[0] || null;

  // Manual calendar events
  let events: CalendarEvent[] = [];
  if (activeSemester) {
    const { data: eventsData } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("semester_id", activeSemester.id)
      .order("start_time", { ascending: true });
    events = (eventsData as CalendarEvent[]) || [];
  }

  // Assignments for this semester
  let assignments: Assignment[] = [];
  if (activeSemester) {
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id")
      .eq("semester_id", activeSemester.id);

    const subjectIds = subjects?.map((s) => s.id) || [];
    if (subjectIds.length > 0) {
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select("*, subject:subjects(*)")
        .in("subject_id", subjectIds)
        .not("deadline", "is", null);
      assignments = (assignmentsData as Assignment[]) || [];
    }
  }

  return (
    <CalendarView
      profile={profile as Profile}
      semester={activeSemester}
      events={events}
      assignments={assignments}
    />
  );
}
