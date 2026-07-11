"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Plus, Shuffle, Trash2 } from "lucide-react";
import { useAdminSession } from "@/components/admin/admin-session-provider";
import { RevealInView } from "@/components/motion/reveal-in-view";
import { MediaLightbox } from "@/components/shared/media-lightbox";
import { MediaMasonry } from "@/components/shared/media-masonry";
import { MobileSectionNav } from "@/components/nav/mobile-section-nav";
import { SideNavRail } from "@/components/nav/side-nav-rail";
import { buttonClasses } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PageHero } from "@/components/ui/page-hero";
import type { ArchiveBlock, CreativeArchiveItem } from "@/lib/site-config";

type SaveState = "idle" | "saving" | "saved" | "error";

const DEFAULT_INITIAL_COLUMN_COUNT = 3;

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

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function replaceSubsetOrder<T>(
  source: T[],
  nextSubset: T[],
  belongsToSubset: (item: T) => boolean,
): T[] {
  let subsetIndex = 0;

  return source.map((item) => {
    if (!belongsToSubset(item)) {
      return item;
    }

    const replacement = nextSubset[subsetIndex];
    subsetIndex += 1;
    return replacement;
  });
}

function buildArchiveLayoutPayload(items: CreativeArchiveItem[]) {
  const counters = new Map<string, number>();

  return items.map((item) => {
    const blockKey = item.block_id ?? "__ungrouped__";
    const columnKey = item.column_index ?? 0;
    const key = `${blockKey}::${columnKey}`;
    const nextSortOrder = counters.get(key) ?? 0;
    counters.set(key, nextSortOrder + 1);

    return {
      id: item.id,
      blockId: item.block_id ?? null,
      columnIndex: item.column_index ?? 0,
      sortOrder: nextSortOrder,
    };
  });
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

  const [items, setItems] = useState<CreativeArchiveItem[]>(initialItems);
  const [blocks, setBlocks] = useState<ArchiveBlock[]>(initialBlocks ?? []);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState("");
  const [newBlockDescription, setNewBlockDescription] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [uploadState, setUploadState] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  const confirm = useConfirm();
  const autosaveTimeoutRef = useRef<number | null>(null);
  const clearSavedRef = useRef<number | null>(null);
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
            layout: buildArchiveLayoutPayload(items),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            getErrorMessage(data.error ?? data.details ?? "save-failed"),
          );
        }

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

  async function computeFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

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

    const VERCEL_LIMIT = 4.4 * 1024 * 1024;
    const SUPABASE_LIMIT = 50 * 1024 * 1024;

    const validFiles = Array.from(files).filter(
      (file) =>
        file.type.startsWith("image/") || file.type.startsWith("video/"),
    );

    const oversizedFiles = Array.from(files).filter(
      (file) => file.size > SUPABASE_LIMIT,
    );

    if (oversizedFiles.length > 0) {
      setUploadState(
        `${oversizedFiles.length} file(s) exceed 50MB limit and were skipped`,
      );
      window.setTimeout(() => setUploadState(""), 3000);
    }

    const smallFiles = validFiles.filter((file) => file.size <= VERCEL_LIMIT);
    const largeFiles = validFiles.filter((file) => file.size > VERCEL_LIMIT);

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
        const fileHash = await computeFileHash(file);

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

        if (signedData.duplicate) {
          await createArchiveItem(
            signedData.publicUrl,
            file.type,
            fileHash,
            file.name,
            selectedBlockId,
          );
          duplicateCount += 1;
          continue;
        }

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

        await createArchiveItem(
          signedData.publicUrl,
          file.type,
          fileHash,
          file.name,
          selectedBlockId,
        );

        uploadedCount += 1;
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
      createData = {
        error: `Create failed (status ${createResponse.status})`,
      };
    }

    if (!createResponse.ok) {
      throw new Error(getErrorMessage(createData?.error ?? "create-failed"));
    }

    const item = createData?.item;
    if (!item) {
      throw new Error("Upload succeeded but no item returned");
    }

    setItems((current) => {
      const existingInBlock = current.filter(
        (entry) => entry.block_id === blockId,
      ).length;

      return [
        ...current,
        {
          id: item.id,
          url: item.url,
          type: item.type,
          title: item.title,
          description: item.description,
          fileHash: item.fileHash,
          filename: item.filename,
          block_id: item.block_id,
          block_title: item.block_title,
          block_description: item.block_description,
          column_index:
            item.column_index ?? existingInBlock % DEFAULT_INITIAL_COLUMN_COUNT,
        },
      ];
    });
  }

  async function deleteItem(index: number) {
    const confirmed = await confirm({
      title: "Remove this item?",
      message: "This will delete the media from storage permanently.",
      confirmLabel: "Remove",
    });

    if (!confirmed) return;

    const itemToDelete = items[index];
    if (!itemToDelete) return;

    setItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );

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
    }
  }

  async function updateBlock(
    blockId: string,
    title: string,
    description?: string,
  ) {
    const response = await fetch(`/api/admin/archive-blocks/${blockId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });

    const data = await response.json();

    if (!data.error) {
      setBlocks((current) =>
        current.map((block) =>
          block.id === blockId
            ? { ...block, title, description: description ?? null }
            : block,
        ),
      );
    }

    setEditingBlock(null);
  }

  async function confirmDeleteBlock(blockId: string) {
    const confirmed = await confirm({
      title: "Delete this block?",
      message: "This will delete the block and all its media permanently.",
      confirmLabel: "Delete",
    });

    if (!confirmed) return;

    await deleteBlock(blockId);
  }

  async function deleteBlock(blockId: string) {
    setItems((current) => current.filter((item) => item.block_id !== blockId));
    setBlocks((current) => current.filter((block) => block.id !== blockId));

    await fetch(`/api/admin/archive-blocks/${blockId}`, {
      method: "DELETE",
    });
  }

  const archiveSections = blocks.map((block, index) => ({
    id: block.id,
    index: String(index + 1).padStart(2, "0"),
    label: block.title,
    title: block.title,
  }));

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
          <section className="mt-4 pb-2 sm:pb-4">
            <div className="flex flex-col gap-4 rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/72">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-white/82">Creative Archive editor</p>
                  <p className="mt-1 text-white/44">
                    Create blocks, upload media, and manually arrange columns.
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
                      className={buttonClasses({
                        tone: "primary",
                        size: "sm",
                      })}
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
                  <Plus className="size-4" />
                  Add Block
                </button>
              )}
            </div>
          </section>
        ) : null}

        <section className="space-y-12 py-12 sm:py-16">
          <RevealInView>
            {blocks.length > 0 ? (
              blocks.map((block) => {
                const blockItems = items.filter(
                  (item) => item.block_id === block.id,
                );

                return (
                  <div key={block.id} id={block.id} className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
                      <div>
                        <p className="text-[0.66rem] uppercase tracking-[0.34em] text-white/30">
                          Gallery
                        </p>
                      </div>

                      {adminMode ? (
                        <div className="flex items-center gap-2">
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
                              onChange={(event) =>
                                void uploadFiles(event.target.files, block.id)
                              }
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => void confirmDeleteBlock(block.id)}
                            className={buttonClasses({
                              tone: "danger",
                              size: "sm",
                            })}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2 border-b border-white/8 pb-4">
                      {adminMode && editingBlock === block.id ? (
                        <>
                          <input
                            value={editingTitle}
                            onChange={(event) =>
                              setEditingTitle(event.target.value)
                            }
                            onBlur={() =>
                              void updateBlock(
                                block.id,
                                editingTitle,
                                editingDescription,
                              )
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                void updateBlock(
                                  block.id,
                                  editingTitle,
                                  editingDescription,
                                );
                              }

                              if (event.key === "Escape") {
                                setEditingBlock(null);
                              }
                            }}
                            className="w-full bg-transparent text-2xl font-semibold text-white outline-none"
                            autoFocus
                          />

                          <textarea
                            value={editingDescription}
                            onChange={(event) =>
                              setEditingDescription(event.target.value)
                            }
                            onBlur={() =>
                              void updateBlock(
                                block.id,
                                editingTitle,
                                editingDescription,
                              )
                            }
                            className="w-full bg-transparent text-sm leading-6 text-white/54 outline-none"
                            rows={2}
                          />
                        </>
                      ) : adminMode ? (
                        <>
                          <h2
                            className="cursor-pointer text-2xl font-semibold text-white"
                            onClick={() => {
                              setEditingBlock(block.id);
                              setEditingTitle(block.title);
                              setEditingDescription(block.description ?? "");
                            }}
                          >
                            {block.title}
                          </h2>

                          {block.description ? (
                            <p className="text-sm leading-6 text-white/54">
                              {block.description}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <h2 className="text-2xl font-semibold text-white">
                            {block.title}
                          </h2>

                          {block.description ? (
                            <p className="text-sm leading-6 text-white/54">
                              {block.description}
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>

                    {blockItems.length > 0 ? (
                      <MediaMasonry
                        items={blockItems}
                        onItemClick={(itemId) =>
                          setActiveIndex(
                            items.findIndex((item) => item.id === itemId),
                          )
                        }
                        adminMode={adminMode}
                        onReorder={(nextBlockItems) => {
                          setItems((current) =>
                            replaceSubsetOrder(
                              current,
                              nextBlockItems,
                              (item) => item.block_id === block.id,
                            ),
                          );
                        }}
                        onDeleteItem={(itemId) => {
                          const globalIndex = items.findIndex(
                            (item) => item.id === itemId,
                          );

                          if (globalIndex !== -1) {
                            void deleteItem(globalIndex);
                          }
                        }}
                      />
                    ) : adminMode ? (
                      <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.02] p-4 text-center">
                        <p className="text-sm text-white/44">
                          No items in this block yet. Use the "Add media" button
                          above to upload.
                        </p>
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
