import { ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuthForm } from "@/components/auth/auth-form";
import { getAdminContext } from "@/lib/auth/admin";

type AuthPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  value: string | string[] | undefined,
  fallback = "",
) {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const admin = await getAdminContext();
  const error = readParam(params.error);
  const signedOut = readParam(params["signed-out"]);

  const statusTone = error
    ? "border-rose-400/18 bg-rose-500/8 text-rose-200/88"
    : signedOut
      ? "border-white/10 bg-white/[0.03] text-white/68"
      : admin.user && admin.isAllowedAdmin
        ? "border-emerald-400/18 bg-emerald-500/8 text-emerald-200/88"
        : "border-white/10 bg-white/[0.03] text-white/60";

  const statusMessage = error
    ? error === "not-authorized"
      ? "That email signed in successfully, but it is not allowed to access admin mode."
      : error === "missing-env"
        ? "Supabase environment variables are not configured yet."
        : error
    : signedOut
      ? "You have been signed out."
      : admin.user && admin.isAllowedAdmin
        ? "Signed in successfully. Admin access is active."
        : "Send a magic link to continue.";

  return (
    <SiteShell>
      <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-[900px] items-center px-5 py-16 sm:px-8 lg:px-10">
        <section className="w-full rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <p className="text-[0.66rem] uppercase tracking-[0.36em] text-white/30">Discreet admin entry</p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-none tracking-[-0.05em] text-white sm:text-6xl">
            Magic-link admin access.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/58 sm:text-lg">
            Login is wired for Supabase magic-link authentication. Access remains restricted to emails that exist inside the `allowed_admins` table.
          </p>

          <div className="mt-10 max-w-lg space-y-4">
            {admin.user && admin.isAllowedAdmin ? (
              <>
                <div className="rounded-[1.5rem] border border-emerald-400/16 bg-emerald-500/8 p-4 text-white/78">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-4 text-emerald-300/90" />
                    <p className="text-sm">Logged in as {admin.user.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    window.location.assign("/auth/sign-out");
                  }}
                  className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/[0.04]"
                  data-cursor="Sign out"
                  data-cursor-position="top"
                >
                  Logout
                </button>
              </>
            ) : (
              <AuthForm defaultEmail="ishant.devdesign@gmail.com" />
            )}

            <div className={`rounded-[1.2rem] border px-4 py-3 text-sm ${statusTone}`}>
              {statusMessage}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </SiteShell>
  );
}
