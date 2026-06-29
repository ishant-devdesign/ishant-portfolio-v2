import {
  ShieldCheck,
  CheckCircle2,
  Info,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuthForm } from "@/components/auth/auth-form";
import { getAdminContext } from "@/lib/auth/admin";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

type AuthPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const admin = await getAdminContext();
  const error = readParam(params.error);
  const signedOut = readParam(params["signed-out"]);

  const showSuccess =
    admin.user && admin.isAllowedAdmin && !error && !signedOut;
  const showError = !!error;
  const showSignedOut = !!signedOut;

  return (
    <SiteShell>
      <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-[900px] items-center px-5 py-16 sm:px-8 lg:px-10">
        <section className="w-full rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <p className="text-[0.66rem] uppercase tracking-[0.36em] text-white/30">
            Admin authentication
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-none tracking-[-0.05em] text-white sm:text-6xl">
            Magic-link access.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/58 sm:text-lg">
            Supabase magic-link authentication with restricted access to emails
            in the{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">
              allowed_admins
            </code>{" "}
            table.
          </p>

          <div className="mt-10 max-w-lg space-y-5">
            {showSuccess ? (
              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-emerald-400/16 bg-emerald-500/8 p-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-5 text-emerald-300/90" />
                    <div>
                      <p className="text-sm font-medium text-white/90">
                        Admin access active
                      </p>
                      <p className="text-xs text-emerald-200/80">
                        Logged in as {admin.user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.2rem] border border-emerald-400/16 bg-emerald-500/6 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-300/90 mt-0.5" />
                    <p className="text-sm text-emerald-200/85">
                      Signed in successfully. You now have admin privileges.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/"
                    className={buttonClasses({ tone: "primary", size: "sm" })}
                    data-cursor="Enter site"
                    data-cursor-position="top"
                  >
                    <ExternalLink className="size-4" />
                    Enter site
                  </Link>
                  <Link
                    href="/auth/sign-out"
                    className={buttonClasses({ tone: "danger", size: "sm" })}
                    data-cursor="Sign out"
                    data-cursor-position="top"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </Link>
                </div>
              </div>
            ) : (
              <AuthForm defaultEmail="ishant.devdesign@gmail.com" />
            )}

            {showError && (
              <div className="rounded-[1.2rem] border border-rose-400/18 bg-rose-500/8 p-3.5">
                <div className="flex items-start gap-2.5">
                  <Info className="size-4 text-rose-300/90 mt-0.5" />
                  <p className="text-sm text-rose-200/85">
                    {error === "not-authorized"
                      ? "That email signed in successfully, but it is not allowed to access admin mode."
                      : error === "missing-env"
                        ? "Supabase environment variables are not configured yet."
                        : error}
                  </p>
                </div>
              </div>
            )}

            {showSignedOut && (
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3.5">
                <div className="flex items-start gap-2.5">
                  <Info className="size-4 text-white/40 mt-0.5" />
                  <p className="text-sm text-white/68">
                    You have been signed out.
                  </p>
                </div>
              </div>
            )}

            {!showSuccess && !showError && !showSignedOut && !admin.user && (
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3.5">
                <div className="flex items-start gap-2.5">
                  <Info className="size-4 text-white/40 mt-0.5" />
                  <p className="text-sm text-white/60">
                    Send a magic link to continue.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </SiteShell>
  );
}
