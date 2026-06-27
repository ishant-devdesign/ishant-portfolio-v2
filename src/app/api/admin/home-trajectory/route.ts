import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";

const workItemSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  period: z.string().min(1),
  note: z.string().min(1),
});

const educationItemSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  period: z.string().min(1),
  note: z.string().min(1),
});

const trajectorySchema = z.object({
  workExperience: z.array(workItemSchema),
  educationItems: z.array(educationItemSchema),
});

export async function PATCH(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const json = await request.json();
  const parsed = trajectorySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  await adminCheck.adminSupabase
    .from("work_experience")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (data.workExperience.length > 0) {
    const { error: workError } = await adminCheck.adminSupabase
      .from("work_experience")
      .insert(
        data.workExperience.map((item, index) => ({
          company: item.company,
          role: item.role,
          period_label: item.period,
          note: item.note,
          visible: true,
          featured: true,
          sort_order: index + 1,
        })),
      );

    if (workError) {
      return NextResponse.json({ error: workError.message }, { status: 500 });
    }
  }

  await adminCheck.adminSupabase
    .from("education_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (data.educationItems.length > 0) {
    const { error: educationError } = await adminCheck.adminSupabase
      .from("education_items")
      .insert(
        data.educationItems.map((item, index) => ({
          institution: item.institution,
          degree: item.degree,
          period_label: item.period,
          note: item.note,
          visible: true,
          featured: true,
          sort_order: index + 1,
        })),
      );

    if (educationError) {
      return NextResponse.json({ error: educationError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
