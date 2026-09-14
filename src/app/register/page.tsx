"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { GraduationCap, UserPlus, AlertCircle, Loader2, KeyRound, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterPageWrapper() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      <RegisterPage />
    </React.Suspense>
  );
}

function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialInvite = searchParams.get("invite") || "";

  // Step state: "invite" | "details"
  const [step, setStep] = React.useState<"invite" | "details">("invite");

  // Invite code state
  const [inviteCode, setInviteCode] = React.useState(initialInvite);
  const [verifyingInvite, setVerifyingInvite] = React.useState(false);
  const [confirmedCode, setConfirmedCode] = React.useState<string | null>(null);

  // Profile details state
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Auto-verify if ?invite=CODE in URL
  React.useEffect(() => {
    if (initialInvite.trim()) {
      handleVerifyInvite(initialInvite.trim());
    }
  }, []);

  const handleVerifyInvite = async (codeToVerify?: string) => {
    const code = (codeToVerify || inviteCode).trim().toUpperCase();
    if (!code) {
      setError("Пожалуйста, введите инвайт-код.");
      return;
    }

    setError(null);
    setVerifyingInvite(true);

    try {
      const res = await fetch("/api/invite/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.message || "Инвайт-код недействителен или не существует.");
        setVerifyingInvite(false);
        return;
      }

      setConfirmedCode(data.code);
      setStep("details");
    } catch (err: any) {
      setError(err.message || "Ошибка при проверке инвайт-кода.");
    } finally {
      setVerifyingInvite(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!confirmedCode) {
      setError("Сначала необходимо подтвердить активный инвайт-код.");
      setStep("invite");
      return;
    }

    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают. Пожалуйста, проверьте ввод.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Всегда регистрируем с ролью student (главный админ назначается в триггере БД по почте hasleranet@gmail.com)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: "student",
            invite_code: confirmedCode,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Ошибка при регистрации");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background relative overflow-hidden py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-2xl tracking-tight mb-2">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span>Study<span className="text-primary">OS</span></span>
          </Link>
          <p className="text-sm text-muted-foreground">Закрытая система учебной группы</p>
        </div>

        <Card className="border-border/70 shadow-xl">
          {step === "invite" ? (
            /* Шаг 1: Проверка инвайт-кода */
            <div>
              <CardHeader className="space-y-1 pb-4 text-center">
                <div className="mx-auto p-3 rounded-full bg-primary/10 text-primary w-fit mb-1">
                  <KeyRound className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold">Вход по приглашению</CardTitle>
                <CardDescription className="text-xs">
                  Регистрация открыта только для участников группы. Введите персональный инвайт-код от старосты.
                </CardDescription>
              </CardHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyInvite();
                }}
              >
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Инвайт-код
                    </label>
                    <Input
                      type="text"
                      placeholder="Например: STUDY-XXXX-YYYY"
                      value={inviteCode}
                      onChange={(e) => {
                        setInviteCode(e.target.value.toUpperCase());
                        setError(null);
                      }}
                      className="font-mono text-center text-base tracking-widest uppercase h-11"
                      autoFocus
                      required
                    />
                    <p className="text-[11px] text-muted-foreground text-center">
                      Код чувствителен к статусу активности в группе
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full gap-2 h-10"
                    disabled={verifyingInvite || !inviteCode.trim()}
                  >
                    {verifyingInvite ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Проверка кода...
                      </>
                    ) : (
                      <>
                        Продолжить регистрацию
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <div className="text-center text-xs text-muted-foreground pt-2">
                    Уже есть аккаунт?{" "}
                    <Link href="/login" className="text-primary hover:underline font-semibold">
                      Войти в систему
                    </Link>
                  </div>
                </CardFooter>
              </form>
            </div>
          ) : (
            /* Шаг 2: Заполнение данных студента */
            <div>
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">Регистрация студента</CardTitle>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Код принят
                  </div>
                </div>
                <CardDescription className="text-xs flex items-center justify-between">
                  <span>Заполните ваши данные для группы</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("invite");
                      setError(null);
                    }}
                    className="text-primary hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Сменить код ({confirmedCode})
                  </button>
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleRegister}>
                <CardContent className="space-y-3.5">
                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Имя и Фамилия *</label>
                    <Input
                      type="text"
                      placeholder="Иван Иванов"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Email *</label>
                    <Input
                      type="email"
                      placeholder="student@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Пароль (от 6 символов) *</label>
                    <Input
                      type="password"
                      placeholder="Придумайте пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Повторите пароль *</label>
                    <Input
                      type="password"
                      placeholder="Повторите пароль"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-3 pt-2">
                  <Button type="submit" className="w-full gap-2 h-10" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Создаем профиль студента...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Зарегистрироваться как студент
                      </>
                    )}
                  </Button>

                  <div className="text-center text-xs text-muted-foreground pt-2">
                    Уже зарегистрированы?{" "}
                    <Link href="/login" className="text-primary hover:underline font-semibold">
                      Войти
                    </Link>
                  </div>
                </CardFooter>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
