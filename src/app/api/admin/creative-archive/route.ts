import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/route-admin";

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  // Get last sort_order to place new item at the end
  const { data: lastItem } = await adminCheck.adminSupabase
    .from("creative_archive")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: inserted, error: insertError } = await adminCheck.adminSupabase
    .from("creative_archive")
    .insert({
      media_url: "",
      media_type: "image",
      sort_order: (lastItem?.sort_order ?? 0) + 1,
    })
    .select("id, media_url, media_type, sort_order")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message ?? "insert-failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    item: {
      id: inserted.id,
      url: inserted.media_url,
      type: inserted.media_type,
    },
  });
}