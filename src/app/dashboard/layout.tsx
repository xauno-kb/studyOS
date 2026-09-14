import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Profile, Semester } from "@/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile
  let profile: Profile | null = null;
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileData) {
    profile = profileData as Profile;
  } else {
    // Fallback if profile row is not yet created
    const fallbackProfile: Profile = {
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || "Студент",
      role: user.user_metadata?.role || "student",
      created_at: new Date().toISOString(),
    };

    await supabase.from("profiles").upsert({
      id: fallbackProfile.id,
      email: fallbackProfile.email,
      full_name: fallbackProfile.full_name,
      role: fallbackProfile.role,
    });

    profile = fallbackProfile;
  }

  // Fetch all semesters
  const { data: semestersData } = await supabase
    .from("semesters")
    .select("*")
    .order("created_at", { ascending: false });

  const semesters = (semestersData as Semester[]) || [];
  const activeSemester = semesters.find((s) => s.is_active) || semesters[0] || null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <DashboardSidebar profile={profile} activeSemester={activeSemester} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <DashboardHeader
          profile={profile}
          semesters={semesters}
          activeSemesterId={activeSemester?.id || null}
        />
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
