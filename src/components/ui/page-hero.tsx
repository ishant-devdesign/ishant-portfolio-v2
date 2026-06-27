import { RevealInView } from "@/components/motion/reveal-in-view";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="border-b border-white/8 pb-12 pt-14 sm:pb-16 sm:pt-20">
      <RevealInView className="max-w-4xl">
        <Link
          href="/"
          className="text-sm mb-6 -ml-2 mr-0 text-white/44 hover:text-white/72 bg-transparent flex items-center transition-colors w-fit rounded-full pt-2 pb-2 pl-2 pr-4 hover:bg-white/5"
          data-cursor="Back"
        >
          <ChevronLeft size={24} /> Back to home
        </Link>
        <p className="text-[0.68rem] uppercase tracking-[0.36em] text-white/34">
          {eyebrow}
        </p>
        <h1 className="font-heading mt-5 text-balance text-5xl leading-none text-white sm:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-base leading-7 text-white/60 sm:text-lg">
          {description}
        </p>
      </RevealInView>
    </section>
  );
}
