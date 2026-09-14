import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Terminal,
  Clock,
  CheckCircle2,
  FileCode2,
  Lock,
  Layers,
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Engineering Header */}
      <header className="border-b border-border/80 bg-card/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 font-semibold text-base tracking-tight">
              <div className="h-7 w-7 rounded bg-primary/10 text-primary border border-primary/25 flex items-center justify-center">
                <Terminal className="h-4 w-4" />
              </div>
              <span>StudyOS</span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono text-muted-foreground bg-muted/60 border border-border/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              3 курс • Инженерный поток
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-xs font-medium px-3.5 py-1.5 rounded border border-transparent hover:border-border hover:bg-accent/60 transition-colors"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="text-xs font-medium px-3.5 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-mono"
            >
              Активировать инвайт
            </Link>
          </div>
        </div>
      </header>

      {/* Main Operations Hero */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 w-full flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center mb-16">
          {/* Left: Briefing & Primary Directives */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded">
              <span>КОНТУР УЧЕБНОЙ ГРУППЫ // v2.4</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-foreground leading-[1.15]">
              Единый рабочий терминал академической группы
            </h1>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl">
              Сквозной трекинг лабораторных работ, синхронизация сдачи для 5 участников, прямой обмен отчетами и автомониторинг дедлайнов. Без потерянных файлов и забытых дедлайнов.
            </p>

            {/* Action Group */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors text-center"
              >
                Войти в личный кабинет
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded border border-border bg-card hover:bg-accent/70 font-medium text-sm transition-colors text-center font-mono"
              >
                Ввести инвайт-код
              </Link>
            </div>

            {/* System Status Indicators */}
            <div className="pt-4 border-t border-border/60 grid grid-cols-3 gap-4 text-left">
              <div>
                <div className="font-mono text-lg font-semibold text-foreground">5</div>
                <div className="text-[11px] text-muted-foreground">Мест в группе</div>
              </div>
              <div>
                <div className="font-mono text-lg font-semibold text-emerald-400">100%</div>
                <div className="text-[11px] text-muted-foreground">Закрытый периметр</div>
              </div>
              <div>
                <div className="font-mono text-lg font-semibold text-primary">0</div>
                <div className="text-[11px] text-muted-foreground">Хаоса с файлами</div>
              </div>
            </div>
          </div>

          {/* Right: Live Cohort Telemetry Deck (The Memorable Bold Centerpiece) */}
          <div className="lg:col-span-6 w-full">
            <div className="rounded border border-border bg-card/90 shadow-2xl overflow-hidden">
              {/* Cockpit Titlebar */}
              <div className="px-4 py-2.5 bg-muted/40 border-b border-border/80 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-foreground font-medium">TELEMETRY // CS-301</span>
                </div>
                <span className="text-muted-foreground text-[11px]">Осенний семестр 2026</span>
              </div>

              {/* Urgent Countdown Ticker */}
              <div className="p-4 border-b border-border/70 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="text-xs font-mono text-amber-400 font-medium flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Ближайший дедлайн: Операционные системы
                  </div>
                  <div className="text-sm font-semibold text-foreground mt-0.5">
                    Лабораторная работа №3: Алгоритмы планирования CPU
                  </div>
                </div>
                <div className="shrink-0">
                  <span className="inline-block px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs font-semibold">
                    2д 14ч осталось
                  </span>
                </div>
              </div>

              {/* Group Roster Matrix Stream (5 seats) */}
              <div className="p-4 space-y-2">
                <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
                  Статус группы по текущей работе (ОС · Лаб 3)
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded bg-primary/20 text-primary font-mono text-[10px] flex items-center justify-center font-bold">1</span>
                      <span className="font-medium text-foreground">Иван К.</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono">Староста</span>
                    </div>
                    <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Сдано (зачет)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded bg-primary/20 text-primary font-mono text-[10px] flex items-center justify-center font-bold">2</span>
                      <span className="font-medium text-foreground">Алексей М.</span>
                    </div>
                    <span className="font-mono text-[11px] text-sky-400 flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      На проверке у препода
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded bg-primary/20 text-primary font-mono text-[10px] flex items-center justify-center font-bold">3</span>
                      <span className="font-medium text-foreground">Дарья С.</span>
                    </div>
                    <span className="font-mono text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      Пишет код отчета
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded bg-primary/20 text-primary font-mono text-[10px] flex items-center justify-center font-bold">4</span>
                      <span className="font-medium text-foreground">Максим В.</span>
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Еще не начата
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-muted/10 border border-dashed border-border/70 text-xs opacity-70">
                    <div className="flex items-center gap-2 font-mono text-muted-foreground">
                      <span className="h-5 w-5 rounded bg-muted text-muted-foreground text-[10px] flex items-center justify-center font-bold">5</span>
                      <span>Свободный слот студента</span>
                    </div>
                    <span className="font-mono text-[10px] text-primary">
                      Ожидает инвайт
                    </span>
                  </div>
                </div>
              </div>

              {/* Starosta Dispatch Console Notice */}
              <div className="px-4 py-3 bg-muted/20 border-t border-border/70 font-mono text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary font-bold shrink-0">&gt;</span>
                <p className="leading-snug text-[11px]">
                  <span className="text-foreground font-semibold">Сводка старосты:</span> Методичка с вариантами обновлена в репозитории предмета. Защита лабы в пятницу на 2-й паре.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Integrated Technical Architecture Pillars (No floating disconnected cards) */}
        <div className="rounded border border-border bg-card divide-y md:divide-y-0 md:divide-x md:divide-border grid grid-cols-1 md:grid-cols-3">
          <div className="p-6 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-primary font-semibold">01 / МАТРИЦА</span>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-base text-foreground">Сквозной прогресс группы</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Наглядная таблица статусов всех пяти сокурсников по каждой дисциплине. Вы сразу видите, кто уже сдал работу, кто ждет проверки, и кому нужна помощь.
            </p>
          </div>

          <div className="p-6 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-primary font-semibold">02 / РЕПОЗИТОРИЙ</span>
              <FileCode2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-base text-foreground">Обмен отчетами и кодом</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Прямая загрузка исходников, схем и документов с зачетом. Скачивайте файлы сокурсников в один клик для сравнения расчетов и подготовки к защите.
            </p>
          </div>

          <div className="p-6 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-primary font-semibold">03 / ПЕРИМЕТР</span>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-base text-foreground">Закрытый доступ по инвайтам</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Никаких посторонних. Регистрация доступна исключительно по одноразовым кодам от старосты с гарантией сохранения авторских прав и приватности заметок.
            </p>
          </div>
        </div>
      </main>

      {/* Utilitarian Telemetry Footer */}
      <footer className="border-t border-border/80 py-5 text-xs text-muted-foreground bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>StudyOS Workstation Node • 3-й курс</span>
          </div>
          <div>5 авторизованных мест • Защищенный академический контур</div>
        </div>
      </footer>
    </div>
  );
}
