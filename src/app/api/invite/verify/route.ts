import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = body?.code;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { valid: false, message: "Пожалуйста, введите инвайт-код." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const supabase = createAdminClient();

    const { data: invite, error } = await supabase
      .from("invites")
      .select("id, code, is_active")
      .eq("code", cleanCode)
      .single();

    if (error || !invite) {
      return NextResponse.json(
        { valid: false, message: "Инвайт-код не найден в системе. Обратитесь к старосте." },
        { status: 404 }
      );
    }

    if (!invite.is_active) {
      return NextResponse.json(
        { valid: false, message: "Данный инвайт-код уже деактивирован или использован." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: invite.code,
      message: "Инвайт-код подтвержден!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, message: err.message || "Ошибка проверки инвайт-кода." },
      { status: 500 }
    );
  }
}
