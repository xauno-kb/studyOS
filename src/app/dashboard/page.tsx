import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MatrixTable } from "@/components/matrix-table";
import { DeadlineList } from "@/components/deadline-list";
import {
  Profile,
  Semester,
  Subject,
  Assignment,
  Submission,
  CalendarEvent,
} from "@/types/database";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Current Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Active Semester
  const { data: semesters } = await supabase
    .from("semesters")
    .select("*")
    .order("created_at", { ascending: false });

  const activeSemester = semesters?.find((s) => s.is_active) || semesters?.[0] || null;

  // 3. Subjects of active semester
  let subjects: Subject[] = [];
  if (activeSemester) {
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("*")
      .eq("semester_id", activeSemester.id)
      .order("created_at", { ascending: true });
    subjects = (subjectsData as Subject[]) || [];
  }

  // 4. Assignments of subjects
  let assignments: Assignment[] = [];
  const subjectIds = subjects.map((s) => s.id);
  if (subjectIds.length > 0) {
    const { data: assignmentsData } = await supabase
      .from("assignments")
      .select("*, subject:subjects(*)")
      .in("subject_id", subjectIds)
      .order("deadline", { ascending: true, nullsFirst: false });
    assignments = (assignmentsData as Assignment[]) || [];
  }

  // 5. Students (all profiles)
  const { data: studentsData } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  const students = (studentsData as Profile[]) || [];

  // 6. Submissions for these assignments
  let submissions: Submission[] = [];
  const assignmentIds = assignments.map((a) => a.id);
  if (assignmentIds.length > 0) {
    const { data: submissionsData } = await supabase
      .from("submissions")
      .select("*")
      .in("assignment_id", assignmentIds);
    submissions = (submissionsData as Submission[]) || [];
  }

  // 7. My Submissions Map
  const mySubmissionsMap: Record<string, Submission> = {};
  submissions
    .filter((s) => s.user_id === user.id)
    .forEach((s) => {
      mySubmissionsMap[s.assignment_id] = s;
    });

  // 8. Upcoming events (next 7 days)
  let upcomingEvents: CalendarEvent[] = [];
  if (activeSemester) {
    const { data: eventsData } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("semester_id", activeSemester.id)
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(4);
    upcomingEvents = (eventsData as CalendarEvent[]) || [];
  }

  // Stats
  const totalAssignments = assignments.length;
  const myAccepted = Object.values(mySubmissionsMap).filter(
    (s) => s.status === "accepted"
  ).length;
  const myPending = Object.values(mySubmissionsMap).filter(
    (s) => s.status === "review_pending"
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card/80 to-primary/5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Привет, {profile?.full_name || "Студент"}! 👋
            </h1>
            {profile?.role === "admin" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Sparkles className="h-3 w-3" />
                Староста
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {activeSemester
              ? `Активный семестр: ${activeSemester.name}`
              : "Семестр еще не создан. Добавьте его в панели предметов."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/calendar"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-sm font-medium transition-colors"
          >
            <CalendarIcon className="h-4 w-4" />
            Календарь
          </Link>
          <Link
            href="/dashboard/subjects"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors shadow-sm"
          >
            <BookOpen className="h-4 w-4" />
            Все предметы
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Предметов
              </p>
              <h3 className="text-2xl font-bold mt-1">{subjects.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Всего лаб
              </p>
              <h3 className="text-2xl font-bold mt-1">{totalAssignments}</h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Сдано мной
              </p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-400">
                {myAccepted} <span className="text-xs text-muted-foreground font-normal">/ {totalAssignments}</span>
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                На проверке
              </p>
              <h3 className="text-2xl font-bold mt-1 text-blue-400">
                {myPending}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Deadlines and Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Deadlines (2 cols) */}
        <div className="lg:col-span-2">
          <DeadlineList
            assignments={assignments}
            submissions={mySubmissionsMap}
          />
        </div>

        {/* Upcoming Events / Calendar Widget (1 col) */}
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  Ближайшие события
                </CardTitle>
                <Link
                  href="/dashboard/calendar"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Все
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  На ближайшие дни событий нет.
                </div>
              ) : (
                upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl border border-border/60 bg-card/40 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">
                        {evt.title}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDate(evt.start_time)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Group Progress Matrix */}
      <div>
        <MatrixTable
          students={students}
          subjects={subjects}
          assignments={assignments}
          submissions={submissions}
        />
      </div>
    </div>
  );
}
