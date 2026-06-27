"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { buttonClasses } from "@/components/ui/button";

const emailSchema = z.string().trim().email("Enter a valid email address.");

export function AuthForm({ defaultEmail }: { defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const envReady = useMemo(
    () =>
      Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
    [],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setStatus("error");
      setMessage(parsed.error.issues[0]?.message ?? "Invalid email.");
      return;
    }

    if (!envReady) {
      setStatus("error");
      setMessage("Supabase environment variables are not configured yet.");
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectUrl = `${window.location.origin}/auth/callback?next=/`;

      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true,
        },
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      setStatus("sent");
      setMessage("Magic link sent. Open your email and continue from there.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Failed to send magic link.");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block text-sm text-white/52">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/28"
          placeholder="Enter admin email"
        />
      </label>

      <button
        type="submit"
        disabled={status === "sending" || !envReady}
        className={buttonClasses({ tone: "primary", size: "md" })}
        data-cursor="Submit"
        data-cursor-position="top"
      >
        {status === "sending" ? "Sending…" : "Send magic link"}
      </button>

      {message ? (
        <p
          className={
            status === "error"
              ? "text-sm text-rose-300/88"
              : "text-sm text-emerald-300/88"
          }
        >
          {message}
        </p>
      ) : null}

      {!envReady ? (
        <p className="text-sm text-white/40">
          Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable login.
        </p>
      ) : null}
    </form>
  );
}
