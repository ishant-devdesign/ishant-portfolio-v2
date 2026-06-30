import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";

const insertItemSchema = z.object({
  url: z.string().url(),
  type: z.enum(["image", "video"]),
});

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const json = await request.json();
  const parsed = insertItemSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid-item-payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

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
      media_url: parsed.data.url,
      media_type: parsed.data.type,
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