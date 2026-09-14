"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Profile, Semester } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Calendar,
  ShieldAlert,
  LogOut,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  profile: Profile | null;
  activeSemester?: Semester | null;
}

export function DashboardSidebar({ profile, activeSemester }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    {
      label: "Дашборд",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      label: "Предметы и лабы",
      href: "/dashboard/subjects",
      icon: BookOpen,
      active: pathname.startsWith("/dashboard/subjects") || pathname.startsWith("/dashboard/assignments"),
    },
    {
      label: "Календарь",
      href: "/dashboard/calendar",
      icon: Calendar,
      active: pathname.startsWith("/dashboard/calendar"),
    },
    ...(profile?.role === "admin"
      ? [
          {
            label: "Админ-панель",
            href: "/dashboard/admin",
            icon: ShieldAlert,
            active: pathname.startsWith("/dashboard/admin"),
          },
        ]
      : []),
  ];

  return (
    <aside className="w-64 border-r border-border/70 bg-card/60 flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-border/70 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-base tracking-tight">
          <div className="h-7 w-7 rounded bg-primary/10 text-primary border border-primary/25 flex items-center justify-center">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span>StudyOS</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Active Semester Badge */}
      {activeSemester && (
        <div className="px-4 py-2.5 border-b border-border/40 bg-accent/20 flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground text-[11px]">Семестр:</span>
          <span className="font-medium text-primary truncate max-w-[140px] text-xs" title={activeSemester.name}>
            {activeSemester.name}
          </span>
        </div>
      )}

      {/* Nav Menu */}
      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors",
                item.active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Sign Out */}
      <div className="p-3.5 border-t border-border/70 bg-card/80">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded bg-primary/15 text-primary border border-primary/25 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
            {profile?.full_name?.charAt(0) || <User className="h-3.5 w-3.5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate leading-tight">
              {profile?.full_name || "Студент"}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {profile?.role === "admin" ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <ShieldAlert className="h-2.5 w-2.5" />
                  Староста
                </span>
              ) : (
                <span className="text-[11px] font-mono text-muted-foreground">Студент</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Выйти из системы
        </button>
      </div>
    </aside>
  );
}
