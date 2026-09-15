"use client";

import { useState, useTransition } from "react";
import { loginAdmin } from "@/app/actions/admin";

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6">
      <h1 className="text-xl font-semibold">Login Admin</h1>
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const result = await loginAdmin(formData);
            if (result?.error) setError(result.error);
          });
        }}
        className="flex flex-col gap-3"
      >
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="rounded-lg border border-black/10 px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {isPending ? "Masuk..." : "Masuk"}
        </button>
      </form>
    </main>
  );
}
