import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";

const insertBlockSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const json = await request.json();
  const parsed = insertBlockSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid-block-payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Get last sort_order to place new block at the end
  const { data: lastBlock } = await adminCheck.adminSupabase
    .from("archive_blocks")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: inserted, error: insertError } = await adminCheck.adminSupabase
    .from("archive_blocks")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      sort_order: (lastBlock?.sort_order ?? 0) + 1,
    })
    .select("id, title, description, sort_order")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message ?? "insert-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, block: inserted });
}

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const { data: blocks, error } = await adminCheck.adminSupabase
    .from("archive_blocks")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, blocks });
}