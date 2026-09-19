import Link from "next/link";
import { Logo } from "@/components/Logo";
import { InstallAppButton } from "@/components/InstallAppButton";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <Logo size={64} />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-foreground">Jom</span>
            <span className="text-primary">pesan</span>
          </h1>
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
        <InstallAppButton />
      </div>
    </main>
  );
}
