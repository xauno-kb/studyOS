import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssignmentDetailView } from "@/components/assignment-detail-view";
import { Profile, Assignment, Submission } from "@/types/database";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    id: string;
  };
}

export default async function AssignmentPage({ params }: Props) {
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

  // Assignment with Subject
  const { data: assignmentData } = await supabase
    .from("assignments")
    .select("*, subject:subjects(*)")
    .eq("id", params.id)
    .single();

  if (!assignmentData) {
    notFound();
  }

  const assignment = assignmentData as Assignment;

  // My Submission
  const { data: mySubData } = await supabase
    .from("submissions")
    .select("*")
    .eq("assignment_id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  // Group Submissions (excluding or including all)
  const { data: groupSubsData } = await supabase
    .from("submissions")
    .select("*, profile:profiles(*)")
    .eq("assignment_id", params.id)
    .neq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const groupSubmissions = (groupSubsData as Submission[]) || [];

  return (
    <AssignmentDetailView
      profile={profile as Profile}
      assignment={assignment}
      mySubmission={mySubData as Submission | null}
      groupSubmissions={groupSubmissions}
    />
  );
}
