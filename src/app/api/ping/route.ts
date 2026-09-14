import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { status: "error", message: "Supabase credentials missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, anonKey);
    // Simple lightweight ping query
    const { data, error } = await supabase
      .from("semesters")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      message: "StudyOS Supabase ping successful — database is active 24/7",
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
