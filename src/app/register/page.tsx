"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { GraduationCap, UserPlus, AlertCircle, Loader2, Sparkles, KeyRound } from "lucide-react";
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

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [inviteCode, setInviteCode] = React.useState(initialInvite);

  const [isFirstUser, setIsFirstUser] = React.useState<boolean | null>(null);
  const [checkingFirstUser, setCheckingFirstUser] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Check if system is fresh and this is the first user
  React.useEffect(() => {
    async function checkSystemState() {
      try {
        const supabase = createClient();
        const { count, error } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        if (!error && (count === 0 || count === null)) {
          setIsFirstUser(true);
        } else {
          setIsFirstUser(false);
        }
      } catch {
        setIsFirstUser(false);
      } finally {
        setCheckingFirstUser(false);
      }
    }
    checkSystemState();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // If not the first user, validate invite code
      if (!isFirstUser) {
        if (!inviteCode.trim()) {
          setError("Для регистрации требуется персональный инвайт-код.");
          setLoading(false);
          return;
        }

        const { data: invite, error: inviteError } = await supabase
          .from("invites")
          .select("*")
          .eq("code", inviteCode.trim())
          .eq("is_active", true)
          .single();

        if (inviteError || !invite) {
          setError("Указан недействительный или уже использованный инвайт-код.");
          setLoading(false);
          return;
        }
      }

      // Register user via Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: isFirstUser ? "admin" : "student",
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Successful registration -> go to dashboard
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
          <p className="text-sm text-muted-foreground">Закрытая регистрация участников группы</p>
        </div>

        <Card className="border-border/70 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Регистрация</CardTitle>
              {isFirstUser && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles className="h-3 w-3" />
                  Первый админ
                </span>
              )}
            </div>
            <CardDescription>
              {isFirstUser
                ? "Вы первый пользователь! Вы автоматически получите роль Администратора (старосты)."
                : "Вход в систему ограничен: укажите персональный инвайт-код от старосты."}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Имя и Фамилия</label>
                <Input
                  type="text"
                  placeholder="Иван Иванов"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="ivan@university.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Пароль</label>
                <Input
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              {!checkingFirstUser && !isFirstUser && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                    Инвайт-код
                  </label>
                  <Input
                    type="text"
                    placeholder="Например: INVITE-XXXX-YYYY"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Получите персональный инвайт-код у старосты вашей группы.
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button type="submit" className="w-full gap-2" disabled={loading || checkingFirstUser}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Регистрируем...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {isFirstUser ? "Создать аккаунт старосты" : "Зарегистрироваться"}
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground pt-2">
                Уже зарегистрированы?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Войти
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
