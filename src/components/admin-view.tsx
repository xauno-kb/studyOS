"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Profile, Invite, UserRole } from "@/types/database";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldAlert,
  KeyRound,
  Copy,
  Check,
  Plus,
  Trash2,
  Users,
  ShieldCheck,
  User,
  Sparkles,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AdminViewProps {
  currentProfile: Profile;
  profiles: Profile[];
  invites: Invite[];
}

export function AdminView({
  currentProfile,
  profiles,
  invites,
}: AdminViewProps) {
  const router = useRouter();
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [customCode, setCustomCode] = React.useState("");

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Generate Invite Code
  const handleCreateInvite = async () => {
    setGenerating(true);
    try {
      const supabase = createClient();
      const code =
        customCode.trim().toUpperCase() ||
        `STUDY-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const { error } = await supabase.from("invites").insert({
        code,
        is_active: true,
        created_by: currentProfile.id,
      });

      if (error) throw error;
      setCustomCode("");
      router.refresh();
    } catch (err: any) {
      alert(`Ошибка создания инвайта: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // Toggle or delete invite
  const handleDeleteInvite = async (inviteId: string) => {
    if (!confirm("Удалить этот инвайт-код?")) return;
    const supabase = createClient();
    await supabase.from("invites").delete().eq("id", inviteId);
    router.refresh();
  };

  // Change user role
  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    if (targetUserId === currentProfile.id && newRole !== "admin") {
      if (!confirm("Вы снимаете права старосты с самого себя! Вы уверены?")) return;
    }
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", targetUserId);

    if (error) {
      alert(`Ошибка обновления роли: ${error.message}`);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-amber-400" />
          <h1 className="text-2xl font-bold tracking-tight">Панель управления группой</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Управление приглашениями сокурсников и правами доступа в StudyOS
        </p>
      </div>

      {/* Grid: Invites Generator & Users List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invites Management Card */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Инвайт-коды для регистрации
            </CardTitle>
            <CardDescription>
              Сгенерируйте код или готовую ссылку для сокурсника (до 5 человек в группе)
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Generator Form */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Свой код (или сгенерировать)"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                className="text-xs uppercase"
              />
              <Button
                onClick={handleCreateInvite}
                disabled={generating}
                size="sm"
                className="shrink-0 gap-1.5 text-xs"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Создать инвайт
              </Button>
            </div>

            {/* List of active invites */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Активные инвайты ({invites.length})
              </div>

              {invites.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border/70 text-center text-xs text-muted-foreground">
                  Нет активных инвайтов. Создайте код для приглашения сокурсника.
                </div>
              ) : (
                invites.map((inv) => {
                  const registerUrl = typeof window !== "undefined"
                    ? `${window.location.origin}/register?invite=${inv.code}`
                    : `/register?invite=${inv.code}`;

                  return (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl border border-border/60 bg-card/40 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-sm tracking-wider text-primary">
                          {inv.code}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Создан: {formatDate(inv.created_at)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(inv.code, `code_${inv.id}`)}
                          className="h-8 px-2.5 text-xs gap-1"
                          title="Скопировать только код"
                        >
                          {copiedCode === `code_${inv.id}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          Код
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(registerUrl, `link_${inv.id}`)}
                          className="h-8 px-2.5 text-xs gap-1"
                          title="Скопировать прямую ссылку для регистрации"
                        >
                          {copiedCode === `link_${inv.id}` ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <ExternalLink className="h-3.5 w-3.5" />
                          )}
                          Ссылка
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteInvite(inv.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Group Users List Card */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Участники группы ({profiles.length} / 5)
              </CardTitle>
            </div>
            <CardDescription>
              Список зарегистрированных участников и управление ролью старосты
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {profiles.map((p) => {
              const isMe = p.id === currentProfile.id;
              const isTargetAdmin = p.role === "admin";

              return (
                <div
                  key={p.id}
                  className="p-3 rounded-xl border border-border/60 bg-card/40 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shrink-0">
                      {p.full_name?.charAt(0) || <User className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate flex items-center gap-1.5">
                        <span>{p.full_name}</span>
                        {isMe && (
                          <span className="text-[10px] text-muted-foreground font-normal">
                            (Вы)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isTargetAdmin ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <Sparkles className="h-3 w-3" />
                        Староста
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground px-2 py-1">
                        Студент
                      </span>
                    )}

                    {/* Role toggle button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() =>
                        handleRoleChange(p.id, isTargetAdmin ? "student" : "admin")
                      }
                    >
                      {isTargetAdmin ? "Снять права" : "Сделать старостой"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
