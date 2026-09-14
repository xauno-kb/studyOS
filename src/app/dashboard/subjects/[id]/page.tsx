import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubjectDetailView } from "@/components/subject-detail-view";
import {
  Profile,
  Subject,
  Assignment,
  Submission,
  SubjectMaterial,
  SubjectNote,
} from "@/types/database";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    id: string;
  };
}

export default async function SubjectDetailPage({ params }: Props) {
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

  // Subject
  const { data: subjectData } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!subjectData) {
    notFound();
  }
  const subject = subjectData as Subject;

  // Assignments
  const { data: assignmentsData } = await supabase
    .from("assignments")
    .select("*")
    .eq("subject_id", params.id)
    .order("deadline", { ascending: true, nullsFirst: false });
  const assignments = (assignmentsData as Assignment[]) || [];

  // My Submissions
  const assignmentIds = assignments.map((a) => a.id);
  let mySubmissions: Submission[] = [];
  if (assignmentIds.length > 0) {
    const { data: subsData } = await supabase
      .from("submissions")
      .select("*")
      .eq("user_id", user.id)
      .in("assignment_id", assignmentIds);
    mySubmissions = (subsData as Submission[]) || [];
  }

  // Extra Materials
  let materials: SubjectMaterial[] = [];
  try {
    const { data: matsData, error: matsError } = await supabase
      .from("subject_materials")
      .select("*, uploader:profiles(*)")
      .eq("subject_id", params.id)
      .order("created_at", { ascending: false });
    if (!matsError && matsData) {
      materials = matsData as SubjectMaterial[];
    }
  } catch {
    materials = [];
  }

  // Subject Notes
  let notes: SubjectNote[] = [];
  try {
    const { data: notesData, error: notesError } = await supabase
      .from("subject_notes")
      .select("*, author:profiles(*)")
      .eq("subject_id", params.id)
      .order("created_at", { ascending: false });
    if (!notesError && notesData) {
      notes = notesData as SubjectNote[];
    }
  } catch {
    notes = [];
  }

  return (
    <SubjectDetailView
      profile={profile as Profile}
      subject={subject}
      assignments={assignments}
      mySubmissions={mySubmissions}
      materials={materials}
      notes={notes}
    />
  );
}
