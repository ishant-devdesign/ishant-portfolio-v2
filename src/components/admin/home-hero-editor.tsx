"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminSession } from "@/components/admin/admin-session-provider";
import type { SiteSettings } from "@/lib/site-config";

type HeroDraft = {
  heroHeading: string;
  heroSubheading: string;
  heroIntro: string;
  roleLabel: string;
  location: string;
  availability: string;
  howText: string;
  spotifyEmbedUrl: string;
  spotifyTitle: string;
};

export function useHomeHeroEditor({
  siteSettings,
}: {
  siteSettings: SiteSettings;
}) {
  const { isAllowedAdmin, viewMode } = useAdminSession();
  const [draft, setDraft] = useState<HeroDraft>({
    heroHeading: siteSettings.heroHeading,
    heroSubheading: siteSettings.heroSubheading,
    heroIntro: siteSettings.heroIntro,
    roleLabel: siteSettings.roleLabel,
    location: siteSettings.location,
    availability: siteSettings.availability,
    howText: siteSettings.heroHowText,
    spotifyEmbedUrl:
      siteSettings.spotifyEmbedUrl ??
      "https://open.spotify.com/embed/playlist/37i9dQZEVXcNheyb00KEzN?utm_source=generator&theme=0",
    spotifyTitle: siteSettings.spotifyTitle ?? "Listen with me",
  });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timeoutRef = useRef<number | null>(null);
  const initialValueRef = useRef(JSON.stringify(draft));
  const isEditable = isAllowedAdmin && viewMode === "admin";

  useEffect(() => {
    if (!isEditable) return;

    const serialized = JSON.stringify(draft);
    if (serialized === initialValueRef.current) {
      return;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setSaveState("saving");

    timeoutRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/home-hero", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(draft),
        });

        if (!response.ok) {
          throw new Error(`Save failed with status ${response.status}`);
        }

        initialValueRef.current = serialized;
        setSaveState("saved");
        window.setTimeout(() => setSaveState("idle"), 1200);
      } catch (error) {
        console.error("[admin-home-hero] autosave failed", error);
        setSaveState("error");
      }
    }, 700);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [draft, isEditable]);

  return {
    draft,
    setDraft,
    isEditable,
    saveState,
  };
}
