import { TopNav } from "@/components/nav/top-nav";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_36%),radial-gradient(circle_at_78%_22%,rgba(80,110,255,0.12),transparent_24%),linear-gradient(180deg,#050505_0%,#080808_100%)]" />
      <TopNav />
      {children}
    </div>
  );
}
