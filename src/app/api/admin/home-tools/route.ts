import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";

const toolGroupSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
});

const payloadSchema = z.object({
  groups: z.array(toolGroupSchema),
});

export async function PATCH(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await adminCheck.adminSupabase
    .from("tool_groups")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (parsed.data.groups.length > 0) {
    const { error: insertError } = await adminCheck.adminSupabase
      .from("tool_groups")
      .insert(
        parsed.data.groups.map((group, index) => ({
          title: group.title,
          tools_text: group.text,
          visible: true,
          sort_order: index + 1,
        })),
      );

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
