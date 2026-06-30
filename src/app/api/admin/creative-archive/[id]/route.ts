import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/route-admin";

type UploadedArchiveAsset = {
  bucket: "archive-media";
  path: string;
};

function extractArchiveAsset(url: string): UploadedArchiveAsset | null {
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/archive-media/";
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;

    const path = decodeURIComponent(parsed.pathname.slice(index + marker.length));
    if (!path) return null;

    return { bucket: "archive-media", path };
  } catch {
    return null;
  }
}

async function deleteArchiveAssets(urls: string[], adminSupabase: unknown) {
  const supabase = adminSupabase as {
    storage: { from: (bucket: string) => { remove: (paths: string[]) => Promise<{ error?: { message: string } }> } };
  };
  const paths = [...new Set(urls.map(extractArchiveAsset).filter(Boolean).map((asset) => asset!.path))];
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from("archive-media").remove(paths);
  if (error) {
    console.error("[archive-storage] remove failed", { paths, error: error.message });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const { id } = await context.params;

  const { data: existingItem, error: itemLookupError } = await adminCheck.adminSupabase
    .from("creative_archive")
    .select("id, media_url")
    .eq("id", id)
    .maybeSingle();

  if (itemLookupError || !existingItem?.id) {
    return NextResponse.json({ error: "item-not-found" }, { status: 404 });
  }

  const { error: deleteError } = await adminCheck.adminSupabase
    .from("creative_archive")
    .delete()
    .eq("id", existingItem.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (existingItem.media_url) {
    await deleteArchiveAssets([existingItem.media_url], adminCheck.adminSupabase);
  }

  return NextResponse.json({ ok: true, id });
}