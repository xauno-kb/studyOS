"use client";

import * as React from "react";
import Link from "next/link";
import { Profile, Semester } from "@/types/database";
import { ThemeToggle } from "@/components/theme-toggle";
import { GraduationCap, Menu, X, LayoutDashboard, BookOpen, Calendar, ShieldAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  profile: Profile | null;
  semesters: Semester[];
  activeSemesterId: string | null;
  onSemesterChange?: (id: string) => void;
}

export function DashboardHeader({
  profile,
  semesters,
  activeSemesterId,
}: DashboardHeaderProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: "Дашборд", href: "/dashboard", icon: LayoutDashboard },
    { label: "Предметы и лабы", href: "/dashboard/subjects", icon: BookOpen },
    { label: "Календарь", href: "/dashboard/calendar", icon: Calendar },
    ...(profile?.role === "admin"
      ? [{ label: "Админ-панель", href: "/dashboard/admin", icon: ShieldAlert }]
      : []),
  ];

  return (
    <header className="lg:hidden border-b border-border/70 bg-card/90 backdrop-blur-md sticky top-0 z-30 px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-base">
          <div className="p-1 rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span>Study<span className="text-primary">OS</span></span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-14 bg-card border-b border-border p-4 shadow-xl flex flex-col gap-2 animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
