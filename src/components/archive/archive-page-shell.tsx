"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Plus } from "lucide-react";
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

type ArchiveBlock = {
  id: string;
  title: string;
  description?: string | null;
  sort_order: number;
};

type ArchiveBlockWithItems = {
  block: ArchiveBlock | null;
  items: CreativeArchiveItem[];
};

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
  initialBlocks,
}: {
  initialItems: CreativeArchiveItem[];
  initialBlocks?: ArchiveBlock[];
}) {
  const { isAllowedAdmin, viewMode } = useAdminSession();
  const adminMode = isAllowedAdmin && viewMode === "admin";
  const [items, setItems] = useState(initialItems);
  const [blocks, setBlocks] = useState<ArchiveBlock[]>(initialBlocks ?? []);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState("");
  const [newBlockDescription, setNewBlockDescription] = useState("");
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

  // Compute SHA-256 hash of file for duplicate detection
  async function computeFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Create a new archive block
  async function createBlock() {
    if (!newBlockTitle.trim()) return;

    setUploadState("Creating block…");

    try {
      const response = await fetch("/api/admin/archive-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newBlockTitle,
          description: newBlockDescription || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "create-block-failed");
      }

      setBlocks((current) => [...current, data.block]);
      setShowBlockForm(false);
      setNewBlockTitle("");
      setNewBlockDescription("");
      setUploadState("Block created");
      window.setTimeout(() => setUploadState(""), 1200);
    } catch (error) {
      console.error("[creative-archive] create block failed", error);
      setUploadState(
        `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async function uploadFiles(files: FileList | null, selectedBlockId?: string) {
    if (!files || files.length === 0) return;

    const VERCEL_LIMIT = 4.4 * 1024 * 1024; // Vercel body limit is ~4.5MB
    const SUPABASE_LIMIT = 50 * 1024 * 1024; // Supabase supports up to 50MB

    const validFiles = Array.from(files).filter(
      (file) =>
        file.type.startsWith("image/") || file.type.startsWith("video/"),
    );

    // Check for oversized files (exceeding Supabase limit)
    const oversizedFiles = Array.from(files).filter(
      (f) => f.size > SUPABASE_LIMIT,
    );
    if (oversizedFiles.length > 0) {
      setUploadState(
        `${oversizedFiles.length} file(s) exceed 50MB limit and were skipped`,
      );
      window.setTimeout(() => setUploadState(""), 3000);
    }

    const smallFiles = validFiles.filter((f) => f.size <= VERCEL_LIMIT);
    const largeFiles = validFiles.filter((f) => f.size > VERCEL_LIMIT);

    if (smallFiles.length > 0) {
      await uploadViaVercel(smallFiles, selectedBlockId);
    }

    if (largeFiles.length > 0) {
      await uploadViaSignedUrl(largeFiles, selectedBlockId);
    }
  }

  async function uploadViaVercel(files: File[], selectedBlockId?: string) {
    setUploadState(`Uploading ${files.length} file(s)…`);

    for (const file of files) {
      try {
        // Compute hash for duplicate detection
        const fileHash = await computeFileHash(file);

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
          uploadData = {
            error: `Upload failed (status ${uploadResponse.status})`,
          };
        }
        if (!uploadResponse.ok) {
          throw new Error(uploadData?.error ?? "upload-failed");
        }

        await createArchiveItem(
          uploadData?.publicUrl,
          file.type,
          fileHash,
          file.name,
          selectedBlockId,
        );
      } catch (error) {
        console.error("[creative-archive] Vercel upload failed", error);
        setUploadState(
          `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        return;
      }
    }

    setUploadState("Uploaded");
    window.setTimeout(() => setUploadState(""), 1200);
  }

  async function uploadViaSignedUrl(files: File[], selectedBlockId?: string) {
    setUploadState(`Uploading ${files.length} large file(s)…`);
    let uploadedCount = 0;
    let duplicateCount = 0;

    for (const file of files) {
      try {
        // Compute hash for duplicate detection
        const fileHash = await computeFileHash(file);

        // Step 1: Get signed URL (checks for duplicates server-side)
        const signedResponse = await fetch("/api/admin/upload/signed-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            bucket: "archive-media",
            size: file.size,
            fileHash,
          }),
        });

        let signedData: {
          error?: string;
          signedUrl?: string;
          publicUrl?: string;
          duplicate?: boolean;
        } | null = null;
        try {
          signedData = await signedResponse.json();
        } catch {
          signedData = {
            error: `Signed URL failed (status ${signedResponse.status})`,
          };
        }
        if (
          !signedResponse.ok ||
          (!signedData?.signedUrl && !signedData?.duplicate)
        ) {
          throw new Error(signedData?.error ?? "signed-url-failed");
        }

        // Handle duplicate - skip upload, just add to UI
        if (signedData.duplicate) {
          // Still need to create archive item with existing URL
          await createArchiveItem(
            signedData.publicUrl,
            file.type,
            fileHash,
            file.name,
            selectedBlockId,
          );
          duplicateCount++;
          continue;
        }

        // Step 2: Upload directly to Supabase using signed URL
        if (!signedData.signedUrl) {
          throw new Error("No signed URL returned");
        }
        const putResponse = await fetch(signedData.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });

        if (!putResponse.ok) {
          throw new Error(
            `Direct upload failed (status ${putResponse.status})`,
          );
        }

        // Step 3: Create archive item with the public URL from server
        await createArchiveItem(
          signedData.publicUrl,
          file.type,
          fileHash,
          file.name,
          selectedBlockId,
        );
        uploadedCount++;
      } catch (error) {
        console.error("[creative-archive] signed upload failed", error);
        setUploadState(
          `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        return;
      }
    }

    if (uploadedCount > 0 || duplicateCount > 0) {
      const total = uploadedCount + duplicateCount;
      setUploadState(`Added ${total} file(s)`);
      window.setTimeout(() => setUploadState(""), 1200);
    }
  }

  async function createArchiveItem(
    publicUrl: string | undefined,
    fileType: string,
    fileHash?: string,
    filename?: string,
    blockId?: string,
  ) {
    const mediaType = fileType.startsWith("video/") ? "video" : "image";

    const createResponse = await fetch("/api/admin/creative-archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: publicUrl,
        type: mediaType,
        fileHash,
        filename,
        blockId,
      }),
    });

    let createData: { error?: unknown; item?: CreativeArchiveItem } | null =
      null;
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
        title: item.title,
        description: item.description,
        fileHash: item.fileHash,
      },
    ]);
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

      let data: { error?: unknown } | null = null;
      try {
        data = await response.json();
      } catch {
        data = { error: `Delete failed (status ${response.status})` };
      }
      if (!response.ok) {
        throw new Error(getErrorMessage(data?.error ?? "delete-failed"));
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
          <section className="pb-2 sm:pb-4 mt-4">
            <div className="flex flex-col gap-4 rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/72">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-white/82">Creative Archive editor</p>
                  <p className="mt-1 text-white/44">
                    Create blocks, upload media, reorder via drag-drop.
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
                </div>
              </div>

              {showBlockForm ? (
                <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.02] p-4">
                  <input
                    value={newBlockTitle}
                    onChange={(event) => setNewBlockTitle(event.target.value)}
                    placeholder="Block title (e.g., Branding Work)"
                    className="mb-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                  />
                  <textarea
                    value={newBlockDescription}
                    onChange={(event) =>
                      setNewBlockDescription(event.target.value)
                    }
                    placeholder="Description (optional)"
                    className="mb-3 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void createBlock()}
                      disabled={!newBlockTitle.trim()}
                      className={buttonClasses({ tone: "primary", size: "sm" })}
                    >
                      Create Block
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBlockForm(false)}
                      className={buttonClasses({ tone: "muted", size: "sm" })}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBlockForm(true)}
                  className={buttonClasses({ tone: "ghost", size: "sm" })}
                  style={{ flexShrink: 0, alignSelf: "flex-start" }}
                >
                  <Plus className="size-4" /> Add Block
                </button>
              )}
            </div>
          </section>
        ) : null}

        <section className="space-y-12 py-12 sm:py-16">
          <RevealInView>
            {blocks.length > 0 ? (
              // Group items by block - show all blocks including empty ones
              blocks.map((block) => {
                const blockItems = items.filter(
                  (item) => item.block_id === block.id,
                );

                return (
                  <div key={block.id} className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-semibold text-white">
                          {block.title}
                        </h2>
                        {block.description ? (
                          <p className="text-sm text-white/52">
                            {block.description}
                          </p>
                        ) : null}
                      </div>
                      {adminMode ? (
                        <label
                          className={buttonClasses({
                            tone: "ghost",
                            size: "sm",
                            className: "cursor-pointer",
                          })}
                        >
                          <ImagePlus className="size-4" />
                          Add media
                          <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={(event) =>
                              void uploadFiles(event.target.files, block.id)
                            }
                          />
                        </label>
                      ) : null}
                    </div>
                    {blockItems.length > 0 ? (
                      <MediaMasonry
                        items={blockItems}
                        onItemClick={(index) =>
                          setActiveIndex(
                            items.findIndex((i) => i.id === blockItems[index].id),
                          )
                        }
                        adminMode={adminMode}
                        draggingIndex={draggingIndex}
                        onDragStart={(index) => setDraggingIndex(index)}
                        onDragOver={() => {}}
                        onDrop={(targetIndex) => {
                          if (draggingIndex === null) return;
                          const targetItem = blockItems[targetIndex];
                          const targetGlobalIndex = items.findIndex(
                            (i) => i.id === targetItem.id,
                          );
                          if (targetGlobalIndex !== -1) {
                            setItems((current) =>
                              moveItem(current, draggingIndex, targetGlobalIndex),
                            );
                            setDraggingIndex(null);
                          }
                        }}
                        onDragEnd={() => setDraggingIndex(null)}
                        onDeleteItem={(index) =>
                          deleteItem(
                            items.findIndex((i) => i.id === blockItems[index].id),
                          )
                        }
                      />
                    ) : adminMode ? (
                      <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.02] p-8 text-center">
                        <p className="text-sm text-white/44">No items in this block yet. Use the "Add media" button above to upload.</p>
                      </div>
                    ) : null}
                  </div>
                );
              })
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
