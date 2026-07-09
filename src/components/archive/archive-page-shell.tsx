"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { useAdminSession } from "@/components/admin/admin-session-provider";
import { buttonClasses } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { RevealInView } from "@/components/motion/reveal-in-view";
import { MobileSectionNav } from "@/components/nav/mobile-section-nav";
import { SideNavRail } from "@/components/nav/side-nav-rail";
import { PageHero } from "@/components/ui/page-hero";
import { MediaMasonry } from "@/components/shared/media-masonry";
import { MediaLightbox } from "@/components/shared/media-lightbox";
import type { CreativeArchiveItem } from "@/lib/site-config";
import { Shuffle } from "lucide-react";

type SaveState = "idle" | "saving" | "saved" | "error";

function getErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const maybeError = error as {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
      message?: string;
    };
    if (maybeError.message) return maybeError.message;
    const fieldMessages = Object.values(maybeError.fieldErrors ?? {})
      .flat()
      .filter(Boolean);
    const formMessages = maybeError.formErrors?.filter(Boolean) ?? [];
    const combined = [...fieldMessages, ...formMessages];
    if (combined.length > 0) {
      return combined.join(" • ");
    }
    return JSON.stringify(error);
  }
  return "save-failed";
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function ArchivePageShell({
  initialItems,
}: {
  initialItems: CreativeArchiveItem[];
}) {
  const { isAllowedAdmin, viewMode } = useAdminSession();
  const adminMode = isAllowedAdmin && viewMode === "admin";
  const [items, setItems] = useState(initialItems);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [uploadState, setUploadState] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const confirm = useConfirm();
  const autosaveTimeoutRef = useRef<number | null>(null);
  const clearSavedRef = useRef<number | null>(null);
  const savedItemsRef = useRef(initialItems);
  const lastSavedPayloadRef = useRef(JSON.stringify(initialItems));

  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
      if (clearSavedRef.current) {
        window.clearTimeout(clearSavedRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!adminMode) return;

    const serialized = JSON.stringify(items);
    if (serialized === lastSavedPayloadRef.current) {
      return;
    }

    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
    }

    setSaveState("saving");

    autosaveTimeoutRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/creative-archive/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: items.map((item) => item.id),
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            getErrorMessage(data.error ?? data.details ?? "save-failed"),
          );
        }

        savedItemsRef.current = items;
        lastSavedPayloadRef.current = serialized;
        setSaveState("saved");

        if (clearSavedRef.current) {
          window.clearTimeout(clearSavedRef.current);
        }
        clearSavedRef.current = window.setTimeout(
          () => setSaveState("idle"),
          1200,
        );
      } catch (error) {
        console.error("[creative-archive] autosave failed", error);
        setSaveState("error");
      }
    }, 700);

    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [adminMode, items]);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const MAX_CLIENT_FILE_SIZE = 4.4 * 1024 * 1024; // Vercel default body limit is ~4.5MB
    const validFiles = Array.from(files).filter(
      (file) =>
        (file.type.startsWith("image/") || file.type.startsWith("video/")) &&
        file.size <= MAX_CLIENT_FILE_SIZE,
    );

    // Check for oversized files and warn user
    const oversizedFiles = Array.from(files).filter(
      (f) => f.size > MAX_CLIENT_FILE_SIZE,
    );
    if (oversizedFiles.length > 0) {
      setUploadState(
        `${oversizedFiles.length} file(s) too large (Vercel limit: 4.5MB) - skipped`,
      );
      window.setTimeout(() => setUploadState(""), 3000);
    }

    if (validFiles.length === 0) return;

    setUploadState(`Uploading ${validFiles.length} file(s)…`);

    for (const file of validFiles) {
      try {
        // Step 1: Upload to storage
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "archive-media");

        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        let uploadData: { error?: string; publicUrl?: string } | null = null;
        try {
          uploadData = await uploadResponse.json();
        } catch {
          uploadData = { error: `Upload failed (status ${uploadResponse.status})` };
        }
        if (!uploadResponse.ok) {
          const errorMsg = uploadData?.error === "file-too-large"
            ? `File "${file.name}" exceeds Vercel upload limit`
            : uploadData?.error ?? "upload-failed";
          throw new Error(errorMsg);
        }

        const mediaType = file.type.startsWith("video/") ? "video" : "image";

        // Step 2: Create database record
        const createResponse = await fetch("/api/admin/creative-archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: uploadData?.publicUrl,
            type: mediaType,
          }),
        });

        let createData: { error?: unknown; item?: CreativeArchiveItem } | null = null;
        try {
          createData = await createResponse.json();
        } catch {
          createData = { error: `Create failed (status ${createResponse.status})` };
        }
        if (!createResponse.ok) {
          throw new Error(getErrorMessage(createData?.error ?? "create-failed"));
        }
        const item = createData?.item;
        if (!item) {
          throw new Error("Upload succeeded but no item returned");
        }

        setItems((current) => [
          ...current,
          {
            id: item.id,
            url: item.url,
            type: item.type,
          },
        ]);
      } catch (error) {
        console.error("[creative-archive] upload failed", error);
        setUploadState(`Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        return;
      }
    }

    setUploadState("Uploaded");
    window.setTimeout(() => setUploadState(""), 1200);
  }

  async function deleteItem(index: number) {
    const confirmed = await confirm({
      title: "Remove this item?",
      message: "This will delete the media from storage permanently.",
      confirmLabel: "Remove",
    });
    if (!confirmed) return;

    const itemToDelete = items[index];
    setItems((current) => current.filter((_, i) => i !== index));

    // Delete from storage
    try {
      const response = await fetch(
        `/api/admin/creative-archive/${itemToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(data.error ?? "delete-failed"));
      }
    } catch (error) {
      console.error("[creative-archive] delete failed", error);
      // Still optimistic update, but log error
    }
  }

  const archiveSections = [
    {
      id: "gallery",
      index: "00",
      label: "Archive",
      title: "Gallery",
    },
  ];

  return (
    <>
      <SideNavRail sections={archiveSections} />
      <main className="mx-auto w-full max-w-[1300px] px-5 pb-24 sm:px-8 lg:px-10 xl:pr-32 2xl:pr-40">
        <MobileSectionNav sections={archiveSections} />

        <PageHero
          eyebrow="Creative Archive"
          title="A visual record of everything that led here."
          description="Not every meaningful piece became a case study. This archive collects years of branding, posters, illustrations, marketing campaigns, motion graphics, 3D, and visual experiments that quietly shaped the way I approach design today."
        />

        {adminMode ? (
          <section className="pb-2 sm:pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/72">
              <div>
                <p className="text-white/82">Creative Archive editor</p>
                <p className="mt-1 text-white/44">
                  Upload images and videos (under 4.5MB), reorder via drag-drop.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/44">
                  {saveState === "saving"
                    ? "Saving order…"
                    : saveState === "saved"
                      ? "Saved"
                      : saveState === "error"
                        ? "Save error"
                        : uploadState || "Ready"}
                </span>
                <button
                  type="button"
                  onClick={() => setItems((current) => shuffleArray(current))}
                  disabled={items.length === 0}
                  className={buttonClasses({
                    tone: "muted",
                    size: "sm",
                  })}
                  title="Randomize display order"
                >
                  <Shuffle className="size-4" />
                  Randomize
                </button>
                <label
                  className={buttonClasses({
                    tone: "ghost",
                    size: "sm",
                    className: "cursor-pointer",
                  })}
                  data-cursor="pointer"
                >
                  <ImagePlus className="size-4" />
                  Add media
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(event) => void uploadFiles(event.target.files)}
                  />
                </label>
              </div>
            </div>
          </section>
        ) : null}

        <section className="space-y-10 py-12 sm:py-16">
          <RevealInView>
            {items.length > 0 ? (
              <MediaMasonry
                items={items}
                onItemClick={(index) => setActiveIndex(index)}
                adminMode={adminMode}
                draggingIndex={draggingIndex}
                onDragStart={(index) => setDraggingIndex(index)}
                onDragOver={() => {}}
                onDrop={(targetIndex) => {
                  if (draggingIndex === null) return;
                  setItems((current) =>
                    moveItem(current, draggingIndex, targetIndex),
                  );
                  setDraggingIndex(null);
                }}
                onDragEnd={() => setDraggingIndex(null)}
                onDeleteItem={deleteItem}
              />
            ) : (
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-8 text-center">
                <p className="text-base text-white/56">
                  No creative work has been added yet.
                </p>
              </div>
            )}
          </RevealInView>
        </section>
      </main>

      <MediaLightbox
        items={items}
        activeIndex={activeIndex}
        onChangeIndex={setActiveIndex}
        onClose={() => setActiveIndex(null)}
      />
    </>
  );
}