import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-semibold">Sarapan Tracking</h1>
      <p className="text-sm text-black/60">Pesan sarapan &amp; tracking bayar harian.</p>
      <div className="flex w-full flex-col gap-3">
        <Link
          href="/pesan"
          className="rounded-lg bg-black px-4 py-3 text-white"
        >
          Pesan Sarapan
        </Link>
        <Link
          href="/admin"
          className="rounded-lg border border-black/20 px-4 py-3"
        >
          Masuk sebagai Admin
        </Link>
      </div>
    </main>
  );
}
