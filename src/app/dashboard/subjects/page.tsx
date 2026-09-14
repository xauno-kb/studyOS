import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubjectsView } from "@/components/subjects-view";
import {
  Profile,
  Semester,
  Subject,
  Assignment,
  Submission,
} from "@/types/database";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
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

  // Semesters
  const { data: semestersData } = await supabase
    .from("semesters")
    .select("*")
    .order("created_at", { ascending: false });
  const semesters = (semestersData as Semester[]) || [];

  // Subjects
  const { data: subjectsData } = await supabase
    .from("subjects")
    .select("*")
    .order("created_at", { ascending: true });
  const subjects = (subjectsData as Subject[]) || [];

  // Assignments
  const { data: assignmentsData } = await supabase
    .from("assignments")
    .select("*")
    .order("created_at", { ascending: true });
  const assignments = (assignmentsData as Assignment[]) || [];

  // My Submissions
  const { data: submissionsData } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_id", user.id);
  const mySubmissions = (submissionsData as Submission[]) || [];

  return (
    <SubjectsView
      profile={profile as Profile}
      semesters={semesters}
      subjects={subjects}
      assignments={assignments}
      mySubmissions={mySubmissions}
    />
  );
}
