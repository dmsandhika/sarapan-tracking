import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-card bg-primary-soft text-3xl">
          🍳
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Sarapan Tracking</h1>
          <p className="text-sm text-muted">Pesan sarapan &amp; tracking bayar harian.</p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Link href="/pesan" className="btn-primary w-full">
          Pesan Sarapan
        </Link>
        <Link href="/status" className="btn-secondary w-full">
          Cek Pesanan Saya
        </Link>
        <Link href="/admin" className="btn-ghost w-full">
          Masuk sebagai Admin
        </Link>
      </div>
    </main>
  );
}
