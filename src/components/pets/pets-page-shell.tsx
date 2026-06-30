"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImagePlus,
  PawPrint,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AutoGrowTextarea } from "@/components/admin/auto-grow-textarea";
import { useAdminSession } from "@/components/admin/admin-session-provider";
import { buttonClasses } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { RevealInView } from "@/components/motion/reveal-in-view";
import { MobileSectionNav } from "@/components/nav/mobile-section-nav";
import { SideNavRail } from "@/components/nav/side-nav-rail";
import { PageHero } from "@/components/ui/page-hero";
import { MockMedia } from "@/components/ui/mock-media";
import { cn } from "@/lib/utils";
import type { HomeSectionItem, Pet } from "@/lib/site-config";
import Link from "next/link";

type SaveState = "idle" | "saving" | "saved" | "error";
type PetImageDraft = Pet["images"][number];

function buildPetPayload(pet: Pet) {
  return {
    name: pet.name,
    species: pet.species,
    description: pet.description,
    story: pet.story,
    images: pet.images.map((image) => ({
      url: image.url,
      caption: image.caption,
      featuredOnHome: image.featuredOnHome,
    })),
  };
}

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

function normalizeFeaturedImages(images: PetImageDraft[]) {
  if (images.length === 0) return images;

  const firstFeaturedIndex = images.findIndex((image) => image.featuredOnHome);

  if (firstFeaturedIndex === -1) {
    return images.map((image, index) => ({
      ...image,
      featuredOnHome: index === 0,
    }));
  }

  return images.map((image, index) => ({
    ...image,
    featuredOnHome: index === firstFeaturedIndex,
  }));
}

function moveImage(
  images: PetImageDraft[],
  fromIndex: number,
  toIndex: number,
) {
  if (fromIndex === toIndex) return images;

  const next = [...images];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function PetImageCarousel({
  images,
  petName,
  onImageClick,
}: {
  images: Pet["images"];
  petName: string;
  onImageClick: (index: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  const minSwipeDistance = 50;

  const onTouchStart = (event: React.TouchEvent) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const onTouchMove = (event: React.TouchEvent) => {
    setTouchEndX(event.touches[0].clientX);
  };

  const onTouchEnd = () => {
    const distance = touchStartX - touchEndX;
    const isSwipe = Math.abs(distance) >= minSwipeDistance;

    if (isSwipe && images.length > 1) {
      if (distance > 0 && currentIndex < images.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else if (distance < 0 && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
    }
  };

  if (images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const progressPercent = ((currentIndex + 1) / images.length) * 100;

  return (
    <div className="mt-6">
      <div className="relative overflow-hidden rounded-[1.8rem]">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {images.map((image) => (
            <div key={image.id} className="w-full flex-shrink-0">
              <button
                type="button"
                onClick={() => onImageClick(images.indexOf(image))}
                className="group block w-full text-left"
              >
                <img
                  src={image.url}
                  alt={image.caption || petName}
                  className="h-auto w-full object-cover"
                />
              </button>
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2.5 text-white/80 backdrop-blur disabled:opacity-30"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              disabled={currentIndex === images.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2.5 text-white/80 backdrop-blur disabled:opacity-30"
              aria-label="Next image"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-white/60 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-white/40">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      )}

      {images[currentIndex]?.caption && (
        <p className="mt-2 px-1 text-center text-sm leading-6 text-white/54">
          {images[currentIndex].caption}
        </p>
      )}
    </div>
  );
}

function PetLightbox({
  petName,
  images,
  activeIndex,
  onChangeIndex,
  onClose,
}: {
  petName: string;
  images: Pet["images"];
  activeIndex: number | null;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    const currentIndex = activeIndex;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (images.length <= 1) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onChangeIndex((currentIndex - 1 + images.length) % images.length);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        onChangeIndex((currentIndex + 1) % images.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, images.length, onChangeIndex, onClose]);

  if (
    typeof document === "undefined" ||
    activeIndex === null ||
    !images[activeIndex]
  ) {
    return null;
  }

  const image = images[activeIndex];
  const canNavigate = images.length > 1;

  return createPortal(
    <div className="fixed inset-0 z-[260] bg-black/95 text-white">
      <div className="absolute inset-x-0 top-0 z-[2] flex items-center justify-between gap-4 border-b border-white/10 bg-black/45 px-5 py-4 backdrop-blur-xl">
        <div className="min-w-0">
          <p className="truncate text-sm text-white/82">{petName}</p>
          <p className="mt-1 text-xs text-white/42">
            {activeIndex + 1} / {images.length}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/78 hover:bg-white/[0.08]"
        >
          <X className="size-4" /> Close
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full"
        aria-label="Close image viewer"
      />

      <div className="relative z-[1] flex h-full items-center justify-center px-4 pb-8 pt-24 sm:px-6">
        {canNavigate ? (
          <button
            type="button"
            onClick={() =>
              onChangeIndex((activeIndex - 1 + images.length) % images.length)
            }
            className="absolute left-3 top-1/2 z-[2] -translate-y-1/2 rounded-full border border-white/10 bg-black/45 p-3 text-white/84 backdrop-blur hover:bg-white/[0.08] sm:left-6"
            aria-label="Previous image"
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : null}

        <div
          className="relative z-[2] max-h-full max-w-[min(1400px,100%)]"
          onClick={(event) => event.stopPropagation()}
        >
          <img
            src={image.url}
            alt={image.caption || petName}
            className="max-h-[82vh] w-auto max-w-full object-contain"
          />
          {image.caption ? (
            <div className="mx-auto mt-4 max-w-3xl rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-center text-sm text-white/62 backdrop-blur">
              {image.caption}
            </div>
          ) : null}
        </div>

        {canNavigate ? (
          <button
            type="button"
            onClick={() => onChangeIndex((activeIndex + 1) % images.length)}
            className="absolute right-3 top-1/2 z-[2] -translate-y-1/2 rounded-full border border-white/10 bg-black/45 p-3 text-white/84 backdrop-blur hover:bg-white/[0.08] sm:right-6"
            aria-label="Next image"
          >
            <ArrowRight className="size-5" />
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function PetArticle({
  pet,
  index,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onSaved,
  onDeleted,
}: {
  pet: Pet;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSaved: (pet: Pet) => void;
  onDeleted: (slug: string) => void;
}) {
  const { isAllowedAdmin, viewMode } = useAdminSession();
  const adminMode = isAllowedAdmin && viewMode === "admin";
  const [draft, setDraft] = useState(pet);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [uploadState, setUploadState] = useState("");
  const [deleteState, setDeleteState] = useState<SaveState>("idle");
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [draggingImageIndex, setDraggingImageIndex] = useState<number | null>(
    null,
  );
  const confirm = useConfirm();
  const autosaveTimeoutRef = useRef<number | null>(null);
  const clearSavedRef = useRef<number | null>(null);
  const savedPetRef = useRef(pet);
  const lastSavedPayloadRef = useRef(JSON.stringify(buildPetPayload(pet)));

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

    const serialized = JSON.stringify(buildPetPayload(draft));
    if (serialized === lastSavedPayloadRef.current) {
      return;
    }

    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
    }

    setSaveState("saving");

    autosaveTimeoutRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/pets/${pet.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: serialized,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            getErrorMessage(data.error ?? data.details ?? "save-failed"),
          );
        }

        savedPetRef.current = data.pet;
        lastSavedPayloadRef.current = serialized;
        onSaved(data.pet);
        setSaveState("saved");

        if (clearSavedRef.current) {
          window.clearTimeout(clearSavedRef.current);
        }
        clearSavedRef.current = window.setTimeout(
          () => setSaveState("idle"),
          1200,
        );
      } catch (error) {
        console.error("[pet-profile] autosave failed", error);
        setSaveState("error");
      }
    }, 700);

    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [adminMode, draft, onSaved, pet.slug]);

  async function uploadImage(file: File | null) {
    if (!file) return;
    setUploadState("Uploading…");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "pet-media");

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(getErrorMessage(data.error ?? "upload-failed"));

      setDraft((current) => ({
        ...current,
        images: normalizeFeaturedImages([
          ...current.images,
          {
            id: `${Date.now()}`,
            url: data.publicUrl,
            caption: file.name.replace(/\.[^.]+$/, ""),
            featuredOnHome: current.images.length === 0,
          },
        ]),
      }));
      setUploadState("Uploaded");
      window.setTimeout(() => setUploadState(""), 1200);
    } catch (error) {
      console.error("[pet-gallery] upload failed", error);
      setUploadState("Upload failed");
    }
  }

  async function deletePet() {
    const confirmed = await confirm({
      title: `Delete ${draft.name}?`,
      message: "This will remove the pet and all gallery images.",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    setDeleteState("saving");

    try {
      const response = await fetch(`/api/admin/pets/${pet.slug}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(getErrorMessage(data.error ?? "delete-failed"));
      onDeleted(pet.slug);
      setDeleteState("saved");
    } catch (error) {
      console.error("[pet-profile] delete failed", error);
      setDeleteState("error");
    }
  }

  return (
    <RevealInView delay={index * 0.05}>
      <article
        id={pet.slug}
        className="scroll-mt-28 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 lg:p-6"
      >
        {adminMode ? (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.3rem] border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white/68">
            <div>
              <p>Editing pet profile: {pet.name}</p>
              <p className="mt-1 text-xs text-white/42">
                Autosave is active for content, captions, home image, uploads,
                and reorder.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white/44">
                {deleteState === "saving"
                  ? "Deleting…"
                  : deleteState === "error"
                    ? "Delete error"
                    : saveState === "saving"
                      ? "Autosaving…"
                      : saveState === "saved"
                        ? "Saved"
                        : saveState === "error"
                          ? "Save error"
                          : uploadState || "Ready"}
              </span>
              <button
                type="button"
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="rounded-full border border-white/10 px-3 py-2 text-white/78 transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-35"
              >
                Move up
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="rounded-full border border-white/10 px-3 py-2 text-white/78 transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-35"
              >
                Move down
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(savedPetRef.current);
                  setSaveState("idle");
                }}
                className={buttonClasses({ tone: "ghost", size: "sm" })}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => void deletePet()}
                className={buttonClasses({ tone: "danger", size: "sm" })}
              >
                <Trash2 className="size-4" /> Delete
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-5 border-b border-white/8 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 text-white/34">
              <PawPrint className="size-4" />
              <p className="text-[0.66rem] uppercase tracking-[0.34em]">
                Pet profile
              </p>
            </div>
            {adminMode ? (
              <>
                <AutoGrowTextarea
                  value={draft.name}
                  onChange={(value) =>
                    setDraft((current) => ({ ...current, name: value }))
                  }
                  className="mt-4 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-4xl tracking-[-0.05em] text-white outline-none"
                />
                <input
                  value={draft.species}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      species: event.target.value,
                    }))
                  }
                  className="mt-2 w-full bg-transparent text-sm uppercase tracking-[0.26em] text-white/32 outline-none"
                />
              </>
            ) : (
              <>
                <h2 className="mt-4 text-4xl tracking-[-0.05em] text-white">
                  {draft.name}
                </h2>
                <p className="mt-2 text-sm uppercase tracking-[0.26em] text-white/32">
                  {draft.species}
                </p>
              </>
            )}
          </div>

          {adminMode ? (
            <AutoGrowTextarea
              value={draft.description}
              onChange={(value) =>
                setDraft((current) => ({ ...current, description: value }))
              }
              className="min-h-[1lh] max-w-2xl resize-none overflow-hidden bg-transparent text-base leading-7 text-white/58 outline-none sm:text-right sm:text-lg"
            />
          ) : (
            <p className="max-w-2xl text-base leading-7 text-white/58 sm:text-right sm:text-lg">
              {draft.description}
            </p>
          )}
        </div>

        <div className="mt-6">
          {adminMode ? (
            <AutoGrowTextarea
              value={draft.story}
              onChange={(value) =>
                setDraft((current) => ({ ...current, story: value }))
              }
              className="min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-base leading-8 text-white/62 outline-none"
            />
          ) : (
            <div
              className="
    w-full
    whitespace-pre-wrap
    text-base
    leading-8
    text-white/62
  "
            >
              {draft.story}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {draft.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/48"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-8 border-t border-white/8 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.66rem] uppercase tracking-[0.34em] text-white/30">
                Gallery
              </p>
            </div>
            {adminMode ? (
              <label
                className={buttonClasses({
                  tone: "ghost",
                  size: "sm",
                  className: "cursor-pointer",
                })}
                data-cursor="pointer"
              >
                <ImagePlus className="size-4" />
                Add photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    void uploadImage(event.target.files?.[0] ?? null)
                  }
                />
              </label>
            ) : null}
          </div>

          {draft.images.length > 0 ? (
            adminMode ? (
              <div className="mt-6 columns-1 gap-4 sm:columns-2 xl:columns-3">
                {draft.images.map((image, imageIndex) => (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={() => setDraggingImageIndex(imageIndex)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggingImageIndex === null) return;
                      setDraft((current) => ({
                        ...current,
                        images: normalizeFeaturedImages(
                          moveImage(
                            current.images,
                            draggingImageIndex,
                            imageIndex,
                          ),
                        ),
                      }));
                      setDraggingImageIndex(null);
                    }}
                    onDragEnd={() => setDraggingImageIndex(null)}
                    className={cn(
                      "rounded-[1.6rem] border bg-white/[0.02] p-3 mb-4 break-inside-avoid",
                      image.featuredOnHome
                        ? "border-amber-300/28"
                        : "border-white/10",
                      draggingImageIndex === imageIndex
                        ? "opacity-55"
                        : "opacity-100",
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3 text-xs text-white/46">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
                        <GripVertical className="size-3.5" /> Drag to reorder
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveImageIndex(imageIndex)}
                        className={buttonClasses({ tone: "muted", size: "xs" })}
                      >
                        Preview
                      </button>
                    </div>

                    <div className="overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/20">
                      <img
                        src={image.url}
                        alt={image.caption || draft.name}
                        className="aspect-[4/5] w-full object-cover"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            images: current.images.map((entry, entryIndex) => ({
                              ...entry,
                              featuredOnHome: entryIndex === imageIndex,
                            })),
                          }))
                        }
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm",
                          image.featuredOnHome
                            ? "border-amber-300/40 bg-amber-300/14 text-amber-100"
                            : "border-white/10 text-white/68 hover:bg-white/[0.04]",
                        )}
                      >
                        <Star
                          className={cn(
                            "size-3.5",
                            image.featuredOnHome ? "fill-current" : "",
                          )}
                        />
                        {image.featuredOnHome ? "Home image" : "Set for home"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            images: normalizeFeaturedImages(
                              current.images.filter(
                                (_, entryIndex) => entryIndex !== imageIndex,
                              ),
                            ),
                          }))
                        }
                        className={buttonClasses({ tone: "muted", size: "sm" })}
                      >
                        <X className="size-3.5" /> Remove
                      </button>
                    </div>

                    <AutoGrowTextarea
                      value={image.caption}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          images: current.images.map((entry, entryIndex) =>
                            entryIndex === imageIndex
                              ? { ...entry, caption: value }
                              : entry,
                          ),
                        }))
                      }
                      className="mt-3 min-h-[1lh] w-full resize-none overflow-hidden rounded-[1rem] border border-white/10 bg-white/[0.02] px-3 py-3 text-sm leading-6 text-white/72 outline-none"
                      placeholder="Write a caption for this photo"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 columns-1 gap-4 sm:columns-2 xl:columns-3">
                {draft.images.map((image, imageIndex) => (
                  <div key={image.id} className="mb-4 break-inside-avoid">
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex(imageIndex)}
                      className={`group block w-full overflow-hidden rounded-[1.6rem] border ${image.featuredOnHome ? "border-amber-300/24" : "border-white/10"} bg-black/20 text-left`}
                    >
                      <img
                        src={image.url}
                        alt={image.caption || draft.name}
                        className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </button>
                    {image.caption ? (
                      <p className="mt-3 px-1 text-sm leading-6 text-white/54">
                        {image.caption}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="mt-6">
              <MockMedia
                title={draft.name}
                subtitle="No photos added yet"
                tone="plum"
                aspect="portrait"
              />
            </div>
          )}
        </div>

        <PetLightbox
          petName={draft.name}
          images={draft.images}
          activeIndex={activeImageIndex}
          onChangeIndex={setActiveImageIndex}
          onClose={() => setActiveImageIndex(null)}
        />
      </article>
    </RevealInView>
  );
}

export function PetsPageShell({ initialPets }: { initialPets: Pet[] }) {
  const { isAllowedAdmin, viewMode } = useAdminSession();
  const adminMode = isAllowedAdmin && viewMode === "admin";
  const [pets, setPets] = useState(initialPets);
  const [createState, setCreateState] = useState<SaveState>("idle");

  async function createPet() {
    setCreateState("saving");

    try {
      const response = await fetch("/api/admin/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(getErrorMessage(data.error ?? "create-failed"));

      setPets((current) => [...current, data.pet]);
      setCreateState("saved");
      window.setTimeout(() => setCreateState("idle"), 1200);
      window.setTimeout(() => {
        document
          .getElementById(data.pet.slug)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    } catch (error) {
      console.error("[pet-profile] create failed", error);
      setCreateState("error");
    }
  }

  async function reorderPets(nextPets: Pet[]) {
    setPets(nextPets);

    try {
      const response = await fetch("/api/admin/pets/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: nextPets.map((pet) => pet.slug) }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(getErrorMessage(data.error ?? data.details));
    } catch (error) {
      console.error("[pet-profile] reorder failed", error);
      setCreateState("error");
    }
  }

  const petSections: HomeSectionItem[] = useMemo(
    () =>
      pets.map((pet, index) => ({
        id: pet.slug,
        index: String(index).padStart(2, "0"),
        label: pet.name,
        title: pet.name,
      })),
    [pets],
  );

  return (
    <>
      <SideNavRail sections={petSections} />
      <main className="mx-auto w-full max-w-[1300px] px-5 pb-24 sm:px-8 lg:px-10 xl:pr-32 2xl:pr-40">
        <MobileSectionNav sections={petSections} />

        <PageHero
          eyebrow="Pets"
          title="The companions behind the journey."
          description="Long before this portfolio existed, they were already part of the story. Some are still here, others now live in memory—but every one of them helped shape the person behind the work."
        />

        {adminMode ? (
          <section className="pb-2 sm:pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/72">
              <div>
                <p className="text-white/82">Pets editor</p>
                <p className="mt-1 text-white/44">
                  Create new pets, edit profiles, manage captions, reorder
                  images, and choose the home photo.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/44">
                  {createState === "saving"
                    ? "Creating…"
                    : createState === "saved"
                      ? "Created"
                      : createState === "error"
                        ? "Create error"
                        : "Ready"}
                </span>
                <button
                  type="button"
                  onClick={() => void createPet()}
                  className={buttonClasses({ tone: "ghost", size: "sm" })}
                >
                  <Plus className="size-4" /> Add pet
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="space-y-10 py-12 sm:py-16">
          {pets.map((pet, index) => (
            <PetArticle
              key={pet.slug}
              pet={pet}
              index={index}
              canMoveUp={index > 0}
              canMoveDown={index < pets.length - 1}
              onMoveUp={() => {
                if (index === 0) return;
                const nextPets = [...pets];
                const [moved] = nextPets.splice(index, 1);
                nextPets.splice(index - 1, 0, moved);
                void reorderPets(nextPets);
              }}
              onMoveDown={() => {
                if (index === pets.length - 1) return;
                const nextPets = [...pets];
                const [moved] = nextPets.splice(index, 1);
                nextPets.splice(index + 1, 0, moved);
                void reorderPets(nextPets);
              }}
              onSaved={(nextPet) =>
                setPets((current) =>
                  current.map((entry) =>
                    entry.slug === nextPet.slug ? nextPet : entry,
                  ),
                )
              }
              onDeleted={(slug) =>
                setPets((current) =>
                  current.filter((entry) => entry.slug !== slug),
                )
              }
            />
          ))}
        </section>
      </main>
    </>
  );
}
