import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";

const updateBlockSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const { id } = await params;
  const json = await request.json();
  const parsed = updateBlockSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid-block-payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: updated, error } = await adminCheck.adminSupabase
    .from("archive_blocks")
    .update({
      ...(parsed.data.title && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description ?? null }),
    })
    .eq("id", id)
    .select("id, title, description, sort_order")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "update-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, block: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const { id } = await params;

  // Delete block - CASCADE will delete associated archive_items
  const { error } = await adminCheck.adminSupabase
    .from("archive_blocks")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}