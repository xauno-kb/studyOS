import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  FolderGit2,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span>Study<span className="text-primary">OS</span></span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1.5"
            >
              Регистрация
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Академический хаб для мини-группы студентов</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.15] mb-6">
          Учебный процесс без хаоса и горящих дедлайнов
        </h1>

        <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed">
          Централизованный хаб вашей группы: методички, лабораторные работы, обмен решениями сокурсников в 1 клик, матрица прогресса и умный академический календарь.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            Войти в личный кабинет
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-border bg-card hover:bg-accent font-semibold transition-all flex items-center justify-center gap-2"
          >
            Регистрация по инвайту
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mt-20 text-left w-full">
          <div className="p-6 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-4">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base mb-1.5">Методички и предметы</h3>
            <p className="text-sm text-muted-foreground">
              Все дисциплины, ссылки на Moodle, беседы и файлы оригинальных заданий в одном месте.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base mb-1.5">Обмен решениями</h3>
            <p className="text-sm text-muted-foreground">
              Загружайте отчеты и код. Сокурсники могут скачать файлы для проверки и взаимопомощи.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base mb-1.5">Матрица прогресса</h3>
            <p className="text-sm text-muted-foreground">
              Сводная наглядная таблица статусов всех 5 участников группы по каждой работе.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base mb-1.5">Умный календарь</h3>
            <p className="text-sm text-muted-foreground">
              Автоматические дедлайны лаб + события от старосты: тесты, коллоквиумы, экзамены.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>StudyOS — Закрытый студенческий контур безопасности</span>
          </div>
          <div>24/7 Cloud Hosting • Next.js & Supabase</div>
        </div>
      </footer>
    </div>
  );
}
