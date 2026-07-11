import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";

const layoutItemSchema = z.object({
  id: z.string().min(1),
  blockId: z.string().nullable().optional(),
  columnIndex: z.number().int().min(0).default(0),
  sortOrder: z.number().int().min(0),
});

const payloadSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  layout: z.array(layoutItemSchema).optional(),
});

export async function PATCH(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid-archive-order",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const layoutById = new Map(
    (parsed.data.layout ?? []).map((entry) => [entry.id, entry]),
  );

  for (const [index, id] of parsed.data.ids.entries()) {
    const layoutEntry = layoutById.get(id);

    const updatePayload =
      layoutEntry !== undefined
        ? {
            sort_order: layoutEntry.sortOrder,
            column_index: layoutEntry.columnIndex,
          }
        : {
            sort_order: index,
          };

    const { error } = await adminCheck.adminSupabase
      .from("archive_items")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    ids: parsed.data.ids,
    layout: parsed.data.layout ?? null,
  });
}
