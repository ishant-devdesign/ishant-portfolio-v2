import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/route-admin";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const baseName = "New pet";
  const baseSlug = slugify(baseName) || "new-pet";

  const { data: slugMatches, error: slugError } = await adminCheck.adminSupabase
    .from("pets")
    .select("slug")
    .like("slug", `${baseSlug}%`);

  if (slugError) {
    return NextResponse.json({ error: slugError.message }, { status: 500 });
  }

  const takenSlugs = new Set((slugMatches ?? []).map((item) => item.slug));
  let slug = baseSlug;
  let counter = 2;
  while (takenSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  const { data: lastPet } = await adminCheck.adminSupabase
    .from("pets")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: inserted, error: insertError } = await adminCheck.adminSupabase
    .from("pets")
    .insert({
      slug,
      name: baseName,
      species: "Pet",
      description: "Add a short description for this pet.",
      story: "Add a more personal story here.",
      tags: [],
      visible: true,
      featured: false,
      sort_order: (lastPet?.sort_order ?? 0) + 1,
    })
    .select("slug, name, species, description, story, tags")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message ?? "insert-failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    pet: {
      slug: inserted.slug,
      name: inserted.name,
      species: inserted.species ?? "Pet",
      description: inserted.description,
      story: inserted.story ?? "",
      tags: Array.isArray(inserted.tags) ? inserted.tags : [],
      images: [],
      homeImage: "",
    },
  });
}
