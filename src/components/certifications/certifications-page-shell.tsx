"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronLeft,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import { RevealInView } from "@/components/motion/reveal-in-view";
import { PageHero } from "@/components/ui/page-hero";
import { AutoGrowTextarea } from "@/components/admin/auto-grow-textarea";
import { useAdminSession } from "@/components/admin/admin-session-provider";
import { buttonClasses } from "@/components/ui/button";
import type { Certification } from "@/lib/site-config";
import Link from "next/link";

function createEmptyCertificationDraft() {
  return {
    title: "",
    issuer: "",
    issueYear: String(new Date().getFullYear()),
    note: "",
    credentialUrl: "",
  };
}

function createDraftFromCertification(certification: Certification) {
  return {
    title: certification.title,
    issuer: certification.issuer,
    issueYear: certification.issueDate === "—" ? "" : certification.issueDate,
    note: certification.note,
    credentialUrl: certification.credentialUrl ?? "",
  };
}

function getErrorMessage(value: unknown) {
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
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [editDrafts, setEditDrafts] = useState<
    Record<string, ReturnType<typeof createEmptyCertificationDraft>>
  >(
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

  async function createCertification() {
    setSaveState("saving");
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
        [data.certification.slug]: createDraftFromCertification(
          data.certification,
        ),
      }));
      setDraft(createEmptyCertificationDraft());
      setShowCreateForm(false);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1200);
    } catch (error) {
      console.error("[certifications] create failed", error);
      setSaveState("error");
    }
  }

  async function saveCertification(slug: string) {
    const currentDraft = editDrafts[slug];
    if (!currentDraft) return;

    setSaveState("saving");
    try {
      const response = await fetch(`/api/admin/certifications/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentDraft),
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
        [data.certification.slug]: createDraftFromCertification(
          data.certification,
        ),
      }));
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1200);
    } catch (error) {
      console.error("[certifications] save failed", error);
      setSaveState("error");
    }
  }

  async function reorderCertifications(next: Certification[]) {
    setCertifications(next);
    setSaveState("saving");

    try {
      const response = await fetch("/api/admin/certifications/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slugs: next.map((certification) => certification.slug),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(getErrorMessage(data.error ?? data.details));
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1200);
    } catch (error) {
      console.error("[certifications] reorder failed", error);
      setSaveState("error");
    }
  }

  async function deleteCertification(slug: string, title: string) {
    const confirmed = window.confirm(
      `Delete certification “${title}”? This cannot be undone.`,
    );
    if (!confirmed) return;

    setSaveState("saving");
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
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1200);
    } catch (error) {
      console.error("[certifications] delete failed", error);
      setSaveState("error");
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1300px] px-5 pb-24 sm:px-8 lg:px-10">
      
      <PageHero
        eyebrow="Certifications"
        title="Credentials presented as a credibility archive, not a bullet dump."
        description="Each certification record is designed to support optional badge imagery and optional credential links later through Supabase-backed editing."
      />

      {adminMode ? (
        <section className="pb-4 sm:pb-6">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-white/78">Certification editor</p>
                <p className="mt-1 text-sm text-white/44">
                  Add, edit, reorder, and delete certifications directly from
                  the public page in admin mode.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/44">
                  {saveState === "saving"
                    ? "Saving…"
                    : saveState === "saved"
                      ? "Saved"
                      : saveState === "error"
                        ? "Save error"
                        : "Ready"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm((current) => !current);
                    setSaveState("idle");
                  }}
                  className={buttonClasses({ tone: "ghost", size: "sm" })}
                >
                  <Plus className="size-4" />{" "}
                  {showCreateForm ? "Close form" : "Add certification"}
                </button>
              </div>
            </div>

            {showCreateForm ? (
              <div className="mt-5 grid gap-4 border-t border-white/8 pt-5 lg:grid-cols-2">
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
                <div className="lg:col-span-2">
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
                <div className="flex justify-end lg:col-span-2">
                  <button
                    type="button"
                    onClick={() => void createCertification()}
                    className={buttonClasses({ tone: "primary", size: "sm" })}
                  >
                    Save certification
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="grid items-stretch gap-4 py-12 sm:grid-cols-2 sm:py-16 xl:grid-cols-3">
        {certifications.map((certification, index) => {
          const editDraft =
            editDrafts[certification.slug] ??
            createDraftFromCertification(certification);

          return (
            <RevealInView
              key={certification.slug}
              delay={index * 0.04}
              className="h-full"
            >
              <article className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/52">
                  <BadgeCheck className="size-5" />
                </div>

                {adminMode ? (
                  <>
                    <AutoGrowTextarea
                      value={editDraft.title}
                      onChange={(value) =>
                        setEditDrafts((current) => ({
                          ...current,
                          [certification.slug]: { ...editDraft, title: value },
                        }))
                      }
                      className="mt-6 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-2xl leading-tight tracking-[-0.04em] text-white outline-none"
                    />
                    <AutoGrowTextarea
                      value={editDraft.issuer}
                      onChange={(value) =>
                        setEditDrafts((current) => ({
                          ...current,
                          [certification.slug]: { ...editDraft, issuer: value },
                        }))
                      }
                      className="mt-2 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm text-white/42 outline-none"
                    />
                    <input
                      value={editDraft.issueYear}
                      onChange={(event) =>
                        setEditDrafts((current) => ({
                          ...current,
                          [certification.slug]: {
                            ...editDraft,
                            issueYear: event.target.value,
                          },
                        }))
                      }
                      className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white outline-none"
                      placeholder="Issue year"
                    />
                    <AutoGrowTextarea
                      value={editDraft.credentialUrl}
                      onChange={(value) =>
                        setEditDrafts((current) => ({
                          ...current,
                          [certification.slug]: {
                            ...editDraft,
                            credentialUrl: value,
                          },
                        }))
                      }
                      className="mt-3 min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/72 outline-none"
                      placeholder="Credential URL"
                    />
                    <AutoGrowTextarea
                      value={editDraft.note}
                      onChange={(value) =>
                        setEditDrafts((current) => ({
                          ...current,
                          [certification.slug]: { ...editDraft, note: value },
                        }))
                      }
                      className="mt-4 min-h-[120px] w-full resize-none overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/72 outline-none"
                    />
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (index === 0) return;
                            const next = [...certifications];
                            const [moved] = next.splice(index, 1);
                            next.splice(index - 1, 0, moved);
                            void reorderCertifications(next);
                          }}
                          disabled={index === 0}
                          className={buttonClasses({
                            tone: "muted",
                            size: "sm",
                          })}
                        >
                          Move up
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (index === certificationOrder.length - 1) return;
                            const next = [...certifications];
                            const [moved] = next.splice(index, 1);
                            next.splice(index + 1, 0, moved);
                            void reorderCertifications(next);
                          }}
                          disabled={index === certificationOrder.length - 1}
                          className={buttonClasses({
                            tone: "muted",
                            size: "sm",
                          })}
                        >
                          Move down
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void saveCertification(certification.slug)
                          }
                          className="rounded-full border border-zinc-600/40 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-50 hover:bg-zinc-700"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void deleteCertification(
                              certification.slug,
                              certification.title,
                            )
                          }
                          className={buttonClasses({
                            tone: "danger",
                            size: "sm",
                          })}
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
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
                        className="mt-5 inline-flex items-center gap-2 text-sm text-white/78 underline underline-offset-4"
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
          );
        })}
      </section>
    </main>
  );
}
