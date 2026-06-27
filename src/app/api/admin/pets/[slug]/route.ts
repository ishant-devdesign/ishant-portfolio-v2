import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type UploadedPetAsset = {
  bucket: "pet-media";
  path: string;
};

const petImageSchema = z.object({
  url: z.string().min(1),
  caption: z.string().default(""),
  featuredOnHome: z.boolean().default(false),
});

const payloadSchema = z.object({
  name: z.string().default(""),
  species: z.string().default(""),
  description: z.string().default(""),
  story: z.string().default(""),
  images: z.array(petImageSchema).default([]),
});

function extractUploadedPetAsset(url: string): UploadedPetAsset | null {
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/pet-media/";
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;

    const path = decodeURIComponent(parsed.pathname.slice(index + marker.length));
    if (!path) return null;

    return { bucket: "pet-media", path };
  } catch {
    return null;
  }
}

type AdminSupabaseClient = ReturnType<typeof createSupabaseAdminClient>;

async function deleteUploadedPetAssets(urls: string[], adminSupabase: AdminSupabaseClient) {
  const paths = [...new Set(urls.map(extractUploadedPetAsset).filter(Boolean).map((asset) => asset!.path))];
  if (paths.length === 0) return;

  const { error } = await adminSupabase.storage.from("pet-media").remove(paths);
  if (error) {
    console.error("[pet-storage] remove failed", { paths, error: error.message });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const { slug } = await context.params;
  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid-pet-payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { data: existingPet, error: petLookupError } = await adminCheck.adminSupabase
    .from("pets")
    .select("id, slug, tags")
    .eq("slug", slug)
    .maybeSingle();

  if (petLookupError || !existingPet?.id) {
    return NextResponse.json({ error: "pet-not-found" }, { status: 404 });
  }

  const { data: existingImages, error: existingImagesError } = await adminCheck.adminSupabase
    .from("pet_images")
    .select("image_url")
    .eq("pet_id", existingPet.id);

  if (existingImagesError) {
    return NextResponse.json({ error: existingImagesError.message }, { status: 500 });
  }

  const existingUrls = (existingImages ?? []).map((entry) => entry.image_url).filter(Boolean);
  const nextUrls = parsed.data.images.map((image) => image.url);
  const removedUrls = existingUrls.filter((url) => !nextUrls.includes(url));

  const normalizedImages = parsed.data.images.map((image, index) => ({
    ...image,
    featuredOnHome: parsed.data.images.some((entry) => entry.featuredOnHome)
      ? image.featuredOnHome
      : index === 0,
  }));

  const firstFeaturedIndex = normalizedImages.findIndex((image) => image.featuredOnHome);
  const finalizedImages = normalizedImages.map((image, index) => ({
    ...image,
    featuredOnHome: firstFeaturedIndex === -1 ? index === 0 : index === firstFeaturedIndex,
  }));

  const { error: updatePetError } = await adminCheck.adminSupabase
    .from("pets")
    .update({
      name: parsed.data.name,
      species: parsed.data.species,
      description: parsed.data.description,
      story: parsed.data.story,
    })
    .eq("id", existingPet.id);

  if (updatePetError) {
    return NextResponse.json({ error: updatePetError.message }, { status: 500 });
  }

  const { error: deleteImagesError } = await adminCheck.adminSupabase
    .from("pet_images")
    .delete()
    .eq("pet_id", existingPet.id);

  if (deleteImagesError) {
    return NextResponse.json({ error: deleteImagesError.message }, { status: 500 });
  }

  let insertedImages:
    | Array<{
        id: string;
        image_url: string;
        caption: string | null;
        home_featured: boolean;
      }>
    | null = null;

  if (finalizedImages.length > 0) {
    const { data: inserted, error: insertImagesError } = await adminCheck.adminSupabase
      .from("pet_images")
      .insert(
        finalizedImages.map((image, index) => ({
          pet_id: existingPet.id,
          image_url: image.url,
          caption: image.caption || null,
          home_featured: image.featuredOnHome,
          sort_order: index + 1,
        })),
      )
      .select("id, image_url, caption, home_featured");

    if (insertImagesError) {
      const errorMessage = insertImagesError.message.includes("home_featured")
        ? "pets-schema-outdated-run-add-pets-gallery-editing-sql"
        : insertImagesError.message;

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    insertedImages = inserted ?? null;
  }

  await deleteUploadedPetAssets(removedUrls, adminCheck.adminSupabase);

  const responseImages = (insertedImages ?? finalizedImages.map((image, index) => ({
    id: `${existingPet.id}-${index + 1}`,
    image_url: image.url,
    caption: image.caption || null,
    home_featured: image.featuredOnHome,
  }))).map((image) => ({
    id: image.id,
    url: image.image_url,
    caption: image.caption ?? "",
    featuredOnHome: image.home_featured,
  }));

  return NextResponse.json({
    ok: true,
    pet: {
      slug: existingPet.slug,
      name: parsed.data.name,
      species: parsed.data.species,
      description: parsed.data.description,
      story: parsed.data.story,
      tags: Array.isArray(existingPet.tags) ? existingPet.tags : [],
      images: responseImages,
      homeImage:
        responseImages.find((image) => image.featuredOnHome)?.url ?? responseImages[0]?.url ?? "",
    },
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const { slug } = await context.params;

  const { data: existingPet, error: petLookupError } = await adminCheck.adminSupabase
    .from("pets")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (petLookupError || !existingPet?.id) {
    return NextResponse.json({ error: "pet-not-found" }, { status: 404 });
  }

  const { data: existingImages, error: existingImagesError } = await adminCheck.adminSupabase
    .from("pet_images")
    .select("image_url")
    .eq("pet_id", existingPet.id);

  if (existingImagesError) {
    return NextResponse.json({ error: existingImagesError.message }, { status: 500 });
  }

  const existingUrls = (existingImages ?? []).map((entry) => entry.image_url).filter(Boolean);

  const { error: deleteError } = await adminCheck.adminSupabase
    .from("pets")
    .delete()
    .eq("id", existingPet.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await deleteUploadedPetAssets(existingUrls, adminCheck.adminSupabase);

  return NextResponse.json({ ok: true, slug });
}
