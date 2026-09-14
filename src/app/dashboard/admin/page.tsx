import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminView } from "@/components/admin-view";
import { Profile, Invite } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch current user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch all profiles
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  const profiles = (profilesData as Profile[]) || [];

  // Fetch all invites
  const { data: invitesData } = await supabase
    .from("invites")
    .select("*")
    .order("created_at", { ascending: false });
  const invites = (invitesData as Invite[]) || [];

  return (
    <AdminView
      currentProfile={profile as Profile}
      profiles={profiles}
      invites={invites}
    />
  );
}
