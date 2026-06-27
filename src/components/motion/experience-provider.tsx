"use client";

import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { IntroLoader } from "@/components/motion/intro-loader";
import { CustomCursor } from "@/components/motion/custom-cursor";
import { RouteTransition } from "@/components/motion/route-transition";
import type { SiteSettings } from "@/lib/site-config";
import { ClientEffects } from "../layout/client-effects";

type ExperienceContextValue = {
  introComplete: boolean;
  reducedMotion: boolean;
  loaderWasVisible: boolean;
};

const ExperienceContext = createContext<ExperienceContextValue>({
  introComplete: true,
  reducedMotion: false,
  loaderWasVisible: false,
});

export function useExperience() {
  return useContext(ExperienceContext);
}

function getInitialReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getInitialLoaderState(
  pathname: string,
  settings: SiteSettings,
  reducedMotion: boolean,
) {
  const shouldShowLoader =
    pathname === "/" && settings.loaderEnabled && !reducedMotion;
  return {
    showLoader: shouldShowLoader,
    introComplete: !shouldShowLoader,
    loaderWasVisible: shouldShowLoader,
  };
}

export function ExperienceProvider({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: SiteSettings;
}) {
  const pathname = usePathname();
  const [reducedMotion, setReducedMotion] = useState(getInitialReducedMotion);
  const [loaderState, setLoaderState] = useState(() =>
    getInitialLoaderState(pathname, settings, getInitialReducedMotion()),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const value = useMemo(
    () => ({
      introComplete: loaderState.introComplete,
      reducedMotion,
      loaderWasVisible: loaderState.loaderWasVisible,
    }),
    [loaderState.introComplete, loaderState.loaderWasVisible, reducedMotion],
  );

  return (
    <ExperienceContext.Provider value={value}>
      {settings.cursorEffectsEnabled ? <CustomCursor /> : null}
      <RouteTransition />
      {children}
      {loaderState.showLoader ? (
        <IntroLoader
          name={settings.loaderNameText}
          onComplete={() => {
            setLoaderState((current) => ({
              ...current,
              showLoader: false,
              introComplete: true,
            }));
          }}
        />
      ) : null}
    </ExperienceContext.Provider>
  );
}
