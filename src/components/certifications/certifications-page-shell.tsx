"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import {
  BadgeCheck,
  ExternalLink,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { RevealInView } from "@/components/motion/reveal-in-view";
import { PageHero } from "@/components/ui/page-hero";
import { AutoGrowTextarea } from "@/components/admin/auto-grow-textarea";
import { useAdminSession } from "@/components/admin/admin-session-provider";
import { buttonClasses } from "@/components/ui/button";
import type { Certification } from "@/lib/site-config";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type CertificationDraft = {
  title: string;
  issuer: string;
  issueYear: string;
  note: string;
  credentialUrl: string;
};

function createEmptyCertificationDraft(): CertificationDraft {
  return {
    title: "",
    issuer: "",
    issueYear: String(new Date().getFullYear()),
    note: "",
    credentialUrl: "",
  };
}

function createDraftFromCertification(certification: Certification): CertificationDraft {
  return {
    title: certification.title,
    issuer: certification.issuer,
    issueYear: certification.issueDate === "—" ? "" : certification.issueDate,
    note: certification.note,
    credentialUrl: certification.credentialUrl ?? "",
  };
}

function getErrorMessage(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "action-failed";
    }
  }
  return "action-failed";
}

export function CertificationsPageShell({
  certifications: initialCertifications,
}: {
  certifications: Certification[];
}) {
  const { isAllowedAdmin, viewMode } = useAdminSession();
  const adminMode = isAllowedAdmin && viewMode === "admin";
  const [certifications, setCertifications] = useState(initialCertifications);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draft, setDraft] = useState(createEmptyCertificationDraft());
  const [saveStates, setSaveStates] = useState<Record<string, "saving" | "saved" | "error">>({});
  const autoSaveTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [editDrafts, setEditDrafts] = useState<Record<string, CertificationDraft>>(
    Object.fromEntries(
      initialCertifications.map((certification) => [
        certification.slug,
        createDraftFromCertification(certification),
      ]),
    ),
  );

  const certificationOrder = useMemo(
    () => certifications.map((certification) => certification.slug),
    [certifications],
  );

  const sensors = useSensors(useSensor(PointerSensor));

  // Auto-save with debounce
  const autoSave = useCallback(
    async (slug: string, draftData: CertificationDraft) => {
      // Clear any existing timeout for this slug
      if (autoSaveTimeoutsRef.current[slug]) {
        clearTimeout(autoSaveTimeoutsRef.current[slug]);
      }

      setSaveStates((current) => ({ ...current, [slug]: "saving" }));

      try {
        const response = await fetch(`/api/admin/certifications/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftData),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(getErrorMessage(data.error ?? data.details));

        setCertifications((current) =>
          current.map((certification) =>
            certification.slug === slug ? data.certification : certification,
          ),
        );
        setEditDrafts((current) => ({
          ...current,
          [data.certification.slug]: createDraftFromCertification(data.certification),
        }));
        setSaveStates((current) => ({ ...current, [slug]: "saved" }));

        autoSaveTimeoutsRef.current[slug] = setTimeout(() => {
          setSaveStates((current) => {
            const next = { ...current };
            delete next[slug];
            return next;
          });
        }, 1200);
      } catch (error) {
        console.error("[certifications] save failed", error);
        setSaveStates((current) => ({ ...current, [slug]: "error" }));
      }
    },
    [],
  );

  // Debounced save on edit
  const debouncedSave = useCallback(
    (slug: string, draftData: CertificationDraft) => {
      if (autoSaveTimeoutsRef.current[slug]) {
        clearTimeout(autoSaveTimeoutsRef.current[slug]);
      }
      autoSaveTimeoutsRef.current[slug] = setTimeout(() => {
        void autoSave(slug, draftData);
      }, 1000);
    },
    [autoSave],
  );

  // Update draft and trigger auto-save in admin mode
  const updateEditDraft = useCallback(
    (slug: string, newDraft: CertificationDraft) => {
      setEditDrafts((current) => ({ ...current, [slug]: newDraft }));
      if (adminMode) {
        debouncedSave(slug, newDraft);
      }
    },
    [adminMode, debouncedSave],
  );

  async function createCertification() {
    const saveStateKey = "__create__";
    setSaveStates((current) => ({ ...current, [saveStateKey]: "saving" }));

    try {
      const response = await fetch("/api/admin/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(getErrorMessage(data.error ?? data.details));

      setCertifications((current) => [...current, data.certification]);
      setEditDrafts((current) => ({
        ...current,
        [data.certification.slug]: createDraftFromCertification(data.certification),
      }));
      setDraft(createEmptyCertificationDraft());
      setShowCreateForm(false);
      setSaveStates((current) => {
        const next = { ...current };
        delete next[saveStateKey];
        return next;
      });
    } catch (error) {
      console.error("[certifications] create failed", error);
      setSaveStates((current) => ({ ...current, [saveStateKey]: "error" }));
    }
  }

  async function deleteCertification(slug: string, title: string) {
    const confirmed = window.confirm(
      `Delete certification "${title}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setSaveStates((current) => ({ ...current, [slug]: "saving" }));
    try {
      const response = await fetch(`/api/admin/certifications/${slug}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(getErrorMessage(data.error ?? data.details));

      setCertifications((current) =>
        current.filter((certification) => certification.slug !== slug),
      );
      setEditDrafts((current) => {
        const next = { ...current };
        delete next[slug];
        return next;
      });
      setSaveStates((current) => {
        const next = { ...current };
        delete next[slug];
        return next;
      });
    } catch (error) {
      console.error("[certifications] delete failed", error);
      setSaveStates((current) => ({ ...current, [slug]: "error" }));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = certifications.findIndex((c) => c.slug === active.id);
      const newIndex = certifications.findIndex((c) => c.slug === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const next = arrayMove(certifications, oldIndex, newIndex);
      setCertifications(next);

      // Save the new order
      fetch("/api/admin/certifications/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slugs: next.map((certification) => certification.slug),
        }),
      }).catch((error) => {
        console.error("[certifications] reorder failed", error);
      });
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1300px] px-5 pb-24 sm:px-8 lg:px-10">
      <PageHero
        eyebrow="Certifications"
        title="Proof of curiosity, not just qualifications."
        description="Every certification represents deliberate time invested in learning. Some strengthened technical foundations, others expanded how I think about products, systems, and engineering. Together they reflect a habit of continuous growth rather than collecting badges."
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={certificationOrder}
          strategy={rectSortingStrategy}
        >
          <section className="grid items-stretch gap-4 py-12 sm:grid-cols-2 sm:py-16 xl:grid-cols-3">
            {adminMode && (
              <RevealInView delay={0} className="h-full">
                <div className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/52">
                    <Plus className="size-5" />
                  </div>

                  {showCreateForm ? (
                    <div className="mt-6 grid gap-4">
                      <div>
                        <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                          Title
                        </p>
                        <AutoGrowTextarea
                          value={draft.title}
                          onChange={(value) =>
                            setDraft((current) => ({ ...current, title: value }))
                          }
                          className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/[0.02] px-4 py-3 text-white outline-none"
                        />
                      </div>
                      <div>
                        <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                          Issuer
                        </p>
                        <AutoGrowTextarea
                          value={draft.issuer}
                          onChange={(value) =>
                            setDraft((current) => ({ ...current, issuer: value }))
                          }
                          className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/[0.02] px-4 py-3 text-white outline-none"
                        />
                      </div>
                      <div>
                        <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                          Issue year
                        </p>
                        <input
                          value={draft.issueYear}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              issueYear: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-[1.2rem] border border-white/10 bg-white/[0.02] px-4 py-3 text-white outline-none"
                          placeholder="2026"
                        />
                      </div>
                      <div>
                        <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                          Credential URL
                        </p>
                        <AutoGrowTextarea
                          value={draft.credentialUrl}
                          onChange={(value) =>
                            setDraft((current) => ({
                              ...current,
                              credentialUrl: value,
                            }))
                          }
                          className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/[0.02] px-4 py-3 text-white/72 outline-none"
                        />
                      </div>
                      <div>
                        <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                          Note
                        </p>
                        <AutoGrowTextarea
                          value={draft.note}
                          onChange={(value) =>
                            setDraft((current) => ({ ...current, note: value }))
                          }
                          className="mt-2 min-h-[120px] w-full resize-none overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/72 outline-none"
                        />
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void createCertification()}
                          disabled={!draft.title.trim() || !draft.issuer.trim()}
                          className={buttonClasses({
                            tone: "primary",
                            size: "sm",
                            className: "disabled:opacity-40 disabled:cursor-not-allowed",
                          })}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false);
                            setDraft(createEmptyCertificationDraft());
                          }}
                          className={buttonClasses({ tone: "muted", size: "sm" })}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(true)}
                      className="mt-6 flex-1 cursor-pointer rounded-xl border border-dashed border-white/20 bg-white/[0.01] transition-colors hover:border-white/30 hover:bg-white/[0.02] flex items-center justify-center text-sm text-white/60 hover:text-white/80"
                    >
                      Click to add a new certification
                    </button>
                  )}
                </div>
              </RevealInView>
            )}

            {certifications.map((certification, index) => {
              const editDraft =
                editDrafts[certification.slug] ??
                createDraftFromCertification(certification);

              return (
                <SortableCertificationCard
                  key={certification.slug}
                  certification={certification}
                  editDraft={editDraft}
                  adminMode={adminMode}
                  onEditDraftChange={(newDraft) => updateEditDraft(certification.slug, newDraft)}
                  onDelete={() =>
                    void deleteCertification(certification.slug, certification.title)
                  }
                  saveState={saveStates[certification.slug]}
                  index={index}
                />
              );
            })}
          </section>
        </SortableContext>
      </DndContext>
    </main>
  );
}

function SortableCertificationCard({
  certification,
  editDraft,
  adminMode,
  onEditDraftChange,
  onDelete,
  saveState,
  index,
}: {
  certification: Certification;
  editDraft: CertificationDraft;
  adminMode: boolean;
  onEditDraftChange: (draft: CertificationDraft) => void;
  onDelete: () => void;
  saveState: "saving" | "saved" | "error" | undefined;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: certification.slug });

  const dragStyle = adminMode && transform
    ? {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const saveIndicator = saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Error" : "";

  return (
    <div ref={setNodeRef} style={dragStyle}>
      <RevealInView
        delay={index * 0.04}
        className="h-full"
      >
        <article
          className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/[0.03] p-5"
        >
          {adminMode ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/52 shrink-0">
                  <BadgeCheck className="size-5" />
                </div>
                <button
                  type="button"
                  className={buttonClasses({
                    tone: "muted",
                    iconOnly: true,
                    className: "shrink-0 cursor-grab active:cursor-grabbing",
                  })}
                  title="Drag to reorder"
                  aria-label={`Drag ${certification.title} to reorder`}
                  {...(adminMode ? { ...attributes, ...listeners } : {})}
                >
                  <GripVertical className="size-4" />
                </button>
              </div>
              <div className="mt-6 grid gap-4">
                <AutoGrowTextarea
                  value={editDraft.title}
                  onChange={(value) =>
                    onEditDraftChange({ ...editDraft, title: value })
                  }
                  className="min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-2xl leading-tight tracking-[-0.04em] text-white outline-none"
                />
                <AutoGrowTextarea
                  value={editDraft.issuer}
                  onChange={(value) =>
                    onEditDraftChange({ ...editDraft, issuer: value })
                  }
                  className="min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm text-white/42 outline-none"
                />
                <input
                  value={editDraft.issueYear}
                  onChange={(event) =>
                    onEditDraftChange({ ...editDraft, issueYear: event.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white outline-none"
                  placeholder="Issue year"
                />
                <AutoGrowTextarea
                  value={editDraft.credentialUrl}
                  onChange={(value) =>
                    onEditDraftChange({ ...editDraft, credentialUrl: value })
                  }
                  className="min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/72 outline-none"
                  placeholder="Credential URL"
                />
                <AutoGrowTextarea
                  value={editDraft.note}
                  onChange={(value) =>
                    onEditDraftChange({ ...editDraft, note: value })
                  }
                  className="min-h-[120px] w-full resize-none overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/72 outline-none"
                />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-white/44" aria-live="polite">
                  {saveIndicator}
                </span>
                <button
                  type="button"
                  onClick={onDelete}
                  className={buttonClasses({
                    tone: "danger",
                    size: "sm",
                  })}
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/52">
                <BadgeCheck className="size-5" />
              </div>
              <h2 className="mt-6 text-2xl leading-tight tracking-[-0.04em] text-white">
                {certification.title}
              </h2>
              <p className="mt-2 text-sm text-white/42">
                {certification.issuer} · {certification.issueDate}
              </p>
              <p className="mt-4 flex-1 text-sm leading-6 text-white/56">
                {certification.note}
              </p>
              {certification.credentialUrl ? (
                <a
                  href={certification.credentialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 w-fit px-4 py-2 border border-zinc-600/40 rounded-full inline-flex items-center gap-2 text-sm text-white/78 underline underline-offset-4"
                  data-cursor="Open cred"
                  data-cursor-position="top"
                >
                  Open credential link
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </>
          )}
        </article>
      </RevealInView>
    </div>
  );
}