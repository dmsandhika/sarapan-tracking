"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { loginAdmin } from "@/app/actions/admin";

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-card bg-primary-soft text-2xl">
          🔐
        </span>
        <h1 className="text-lg font-semibold">Login Admin</h1>
      </div>

      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const result = await loginAdmin(formData);
            if (result?.error) setError(result.error);
          });
        }}
        className="card flex flex-col gap-3"
      >
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          autoFocus
          className="field-input"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending ? "Masuk..." : "Masuk"}
        </button>
      </form>

      <Link
        href="/"
        className="inline-flex items-center justify-center gap-1 text-sm text-muted"
      >
        Mau pesan sarapan aja? 👉🏻👈🏻 😚
      </Link>
    </main>
  );
}
