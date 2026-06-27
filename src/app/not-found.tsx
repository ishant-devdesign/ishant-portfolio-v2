import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <SiteShell>
      <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-[1100px] items-center px-5 py-16 sm:px-8 lg:px-10">
        <section className="max-w-3xl">
          <p className="text-[0.66rem] uppercase tracking-[0.36em] text-white/30">
            404 / Archive miss
          </p>
          <h1 className="mt-4 text-5xl leading-none tracking-[-0.05em] text-white sm:text-7xl">
            This page slipped out of the visible index.
          </h1>
          <p className="max-w-2xl text-xl leading-8 text-white/56">
            It looks like this page doesn't exist yet, has moved, or is still
            being crafted. Head back and continue exploring.
          </p>
          <div className="mt-3 flex">
            <Link
              href="/"
              className={buttonClasses({ tone: "primary", size: "md" })}
              data-cursor="Home"
              data-cursor-position="top"
            >
              Back home
            </Link>
            <Link
              href="/projects"
              className={buttonClasses({ tone: "secondary", size: "md" })}
              data-cursor="Projects"
            >
              Browse projects
            </Link>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
