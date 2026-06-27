"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { useAdminSession } from "@/components/admin/admin-session-provider";
import { AutoGrowTextarea } from "@/components/admin/auto-grow-textarea";
import {
  SaveStatusPill,
  type SaveState,
} from "@/components/admin/save-status-pill";
import { buttonClasses } from "@/components/ui/button";
import MagnetLines from "@/components/MagnetLines";
import type { SiteSettings } from "@/lib/site-config";
import { motion } from "framer-motion";

function createFooterDraft(siteSettings: SiteSettings) {
  return {
    cta: siteSettings.contactCtaText ?? "",
    phone: siteSettings.phone,
    email: siteSettings.email,
    whatsappUrl: siteSettings.whatsappUrl,
    gmailComposeUrl: siteSettings.gmailComposeUrl,
    resumeUrl: siteSettings.resumeUrl,
    linkedinUrl: siteSettings.linkedinUrl,
    githubUrl: siteSettings.githubUrl,
    twitterUrl: siteSettings.twitterUrl,
    instagramUrl: siteSettings.instagramUrl,
    dribbbleUrl: siteSettings.dribbbleUrl,
    behanceUrl: siteSettings.behanceUrl,
  };
}

export function SiteFooterShell({
  siteSettings,
}: {
  siteSettings: SiteSettings;
}) {
  const { isAllowedAdmin, viewMode } = useAdminSession();
  const adminMode = isAllowedAdmin && viewMode === "admin";
  const [draft, setDraft] = useState(() => createFooterDraft(siteSettings));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timeoutRef = useRef<number | null>(null);
  const savedRef = useRef(JSON.stringify(createFooterDraft(siteSettings)));

  const emailHref =
    draft.gmailComposeUrl && draft.gmailComposeUrl !== "#"
      ? draft.gmailComposeUrl
      : draft.email
        ? `mailto:${draft.email}`
        : "#";

  const phoneHref = draft.phone
    ? `tel:${draft.phone.replace(/\s+/g, "")}`
    : "#";

  const pageLinks = [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Projects" },
    { href: "/blogs", label: "Blogs" },
    { href: "/certifications", label: "Certifications" },
    { href: "/pets", label: "Pets" },
    { href: "/#contact", label: "Contact" },
  ];

  const publicSocialLinks = useMemo(
    () =>
      [
        { href: draft.linkedinUrl, label: "LinkedIn" },
        { href: draft.githubUrl, label: "GitHub" },
        { href: draft.instagramUrl, label: "Instagram" },
        { href: draft.twitterUrl, label: "X" },
        { href: draft.dribbbleUrl, label: "Dribbble" },
        { href: draft.behanceUrl, label: "Behance" },
      ].filter((item) => item.href && item.href !== "#"),
    [
      draft.behanceUrl,
      draft.dribbbleUrl,
      draft.githubUrl,
      draft.instagramUrl,
      draft.linkedinUrl,
      draft.twitterUrl,
    ],
  );

  const socialFields = [
    { key: "linkedinUrl", label: "LinkedIn URL" },
    { key: "githubUrl", label: "GitHub URL" },
    { key: "instagramUrl", label: "Instagram URL" },
    { key: "twitterUrl", label: "X / Twitter URL" },
    { key: "dribbbleUrl", label: "Dribbble URL" },
    { key: "behanceUrl", label: "Behance URL" },
  ] as const;

  const saveFooter = useCallback(async () => {
    setSaveState("saving");
    try {
      const response = await fetch("/api/admin/home-contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "save-failed",
        );
      }
      savedRef.current = JSON.stringify(draft);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1200);
    } catch (error) {
      console.error("[footer-contact] save failed", error);
      setSaveState("error");
    }
  }, [draft]);

  useEffect(() => {
    if (!adminMode) return;
    const serialized = JSON.stringify(draft);
    if (serialized === savedRef.current) return;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      void saveFooter();
    }, 700);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [adminMode, draft, saveFooter]);

  return (
    <footer className="relative mt-24 border-t border-white/8 bg-[#070707]">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10">
        {adminMode ? (
          <div className="flex items-center gap-3 py-4 text-xs text-white/44">
            <SaveStatusPill state={saveState} />
          </div>
        ) : null}

        <div className="flex flex-col gap-12 py-14 lg:grid-cols-[minmax(0,1.15fr)_360px] xl:grid-cols-[minmax(0,1.2fr)_420px] xl:gap-20">
          <div>
            <p className="text-[0.66rem] uppercase tracking-[0.34em] text-white/30">
              Contact
            </p>
            <div className="mt-6">
              <div>
                {adminMode ? (
                  <>
                    <p className="mb-3 text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                      Email
                    </p>
                    <AutoGrowTextarea
                      value={draft.email}
                      onChange={(value) =>
                        setDraft((current) => ({ ...current, email: value }))
                      }
                      className="font-heading block min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-balance text-[2.5rem] leading-[0.95] tracking-[-0.06em] text-white outline-none sm:text-[3.6rem] lg:text-[4.8rem] xl:text-[5.8rem]"
                      placeholder="Email"
                    />
                  </>
                ) : (
                  <a
                    href={emailHref}
                    target={emailHref.startsWith("http") ? "_blank" : undefined}
                    rel={
                      emailHref.startsWith("http") ? "noreferrer" : undefined
                    }
                    className="p-4 -ml-4
font-heading
block
w-fit
max-w-full
overflow-hidden
break-all
text-[clamp(1.5rem,6vw,5.8rem)]
leading-[0.95]
tracking-[-0.06em]
text-white
transition-colors
hover:text-white/74
"
                    data-cursor="Email"
                    data-cursor-position="top"
                  >
                    {draft.email || "Add email in admin"}
                  </a>
                )}
              </div>

              <div>
                {adminMode ? (
                  <>
                    <p className="mb-3 text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                      Phone
                    </p>
                    <AutoGrowTextarea
                      value={draft.phone}
                      onChange={(value) =>
                        setDraft((current) => ({ ...current, phone: value }))
                      }
                      className="font-heading block min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-[2.2rem] leading-[0.96] tracking-[-0.06em] text-white/82 outline-none sm:text-[3.1rem] lg:text-[4.2rem] xl:text-[4.8rem]"
                      placeholder="Phone"
                    />
                  </>
                ) : (
                  <a
                    href={phoneHref}
                    className="p-4 -ml-4
    font-heading
    block
    w-fit
    max-w-full
    overflow-hidden
    break-words
    text-[clamp(1.5rem,6vw,5.8rem)]
    leading-[0.95]
    tracking-[-0.06em]
    text-white/82
    transition-colors
    hover:text-white
  "
                    data-cursor="Call"
                    data-cursor-position="top"
                  >
                    {draft.phone || "Add phone in admin"}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-[0.66rem] uppercase tracking-[0.34em] text-white/30">
                Pages
              </p>
              <div className="mt-4 flex flex-col text-base text-white/78">
                {pageLinks.map((link) => (
                  <motion.a
                    initial="rest"
                    whileHover="hover"
                    key={link.href}
                    href={link.href}
                    className="transition-colors bg-transparent hover:bg-white/10 py-1 px-4 -ml-4 w-fit flex items-center gap-1"
                    data-cursor={`Open ${link.label}`}
                    data-cursor-position="left"
                  >
                    {link.label}
                    <motion.div
                      variants={{
                        rest: { opacity: 0, x: -4 },
                        hover: { opacity: 1, x: 0 },
                      }}
                      transition={{
                        duration: 0.28,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <ArrowUpRight className="size-3.5 inline-block ml-1" />
                    </motion.div>
                  </motion.a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[0.66rem] uppercase tracking-[0.34em] text-white/30">
                Socials
              </p>
              {adminMode ? (
                <div className="mt-4 space-y-3">
                  {socialFields.map((field) => (
                    <div key={field.key}>
                      <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">
                        {field.label}
                      </p>
                      <input
                        value={draft[field.key]}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white/78 outline-none"
                        placeholder={field.label}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex flex-col text-base text-white/78">
                  {publicSocialLinks.map((link) => (
                    <motion.a
                      initial="rest"
                      whileHover="hover"
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors bg-transparent hover:bg-white/10 py-1 px-4 -ml-4 w-fit flex items-center gap-1"
                      data-cursor={`Open ${link.label}`}
                      data-cursor-position="left"
                    >
                      {link.label}
                      <motion.div
                        variants={{
                          rest: { opacity: 0, x: -4 },
                          hover: { opacity: 1, x: 0 },
                        }}
                        transition={{
                          duration: 0.28,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <ArrowUpRight className="size-3.5 inline-block ml-1" />
                      </motion.div>
                    </motion.a>
                  ))}
                </div>
              )}
            </div>

            <div className="sm:col-span-2 flex flex-wrap gap-3 pt-2">
              <a
                href={draft.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonClasses({ tone: "secondary", size: "sm" })}
                data-cursor="Resume"
                data-cursor-position="top"
              >
                Resume
              </a>
              <Link
                href="/auth"
                className={buttonClasses({ tone: "ghost", size: "sm" })}
                data-cursor="Admin login"
                data-cursor-position="top"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/8 py-5 text-sm text-white/46 lg:flex-row lg:items-center lg:justify-between">
          <p>
            © {new Date().getFullYear()} {siteSettings.siteName}
          </p>
          <p>
            {siteSettings.location} · {siteSettings.availability}
          </p>
        </div>
      </div>
    </footer>
  );
}
