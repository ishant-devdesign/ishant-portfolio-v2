import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";

// Default block ID for items without a specific block
const DEFAULT_BLOCK_ID = "00000000-0000-0000-0000-000000000000";

const insertItemSchema = z.object({
  url: z.string().url(),
  type: z.enum(["image", "video"]),
  blockId: z.string().optional(), // UUID of the block
  filename: z.string().optional(),
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

  // Get last sort_order to place new item at the end (within the block)
  const blockId = parsed.data.blockId || DEFAULT_BLOCK_ID;
  const { data: lastItem } = await adminCheck.adminSupabase
    .from("archive_items")
    .select("sort_order")
    .eq("block_id", blockId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: inserted, error: insertError } = await adminCheck.adminSupabase
    .from("archive_items")
    .insert({
      block_id: blockId,
      media_url: parsed.data.url,
      media_type: parsed.data.type,
      filename: parsed.data.filename ?? null,
      sort_order: (lastItem?.sort_order ?? 0) + 1,
    })
    .select("id, media_url, media_type, sort_order, filename")
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
      filename: inserted.filename,
    },
  });
}

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  // Fetch blocks with their items
  const { data: blocks, error: blocksError } = await adminCheck.adminSupabase
    .from("archive_blocks")
    .select("*")
    .order("sort_order", { ascending: true });

  if (blocksError) {
    return NextResponse.json({ error: blocksError.message }, { status: 500 });
  }

  const { data: items, error: itemsError } = await adminCheck.adminSupabase
    .from("archive_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Group items by block
  const blocksWithItems = blocks.map((block) => ({
    block,
    items: items.filter((item) => item.block_id === block.id),
  }));

  return NextResponse.json({ ok: true, blocks: blocksWithItems });
}