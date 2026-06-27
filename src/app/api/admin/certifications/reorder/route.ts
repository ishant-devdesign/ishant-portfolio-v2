import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";

const payloadSchema = z.object({
  slugs: z.array(z.string().min(1)).min(1),
});

export async function PATCH(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  for (const [index, slug] of parsed.data.slugs.entries()) {
    const { error } = await adminCheck.adminSupabase
      .from("certifications")
      .update({ sort_order: index + 1 })
      .eq("slug", slug);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, slugs: parsed.data.slugs });
}
