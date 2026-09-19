import StatusLookup from "./StatusLookup";

export default function StatusPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-5 pt-6 pb-4 backdrop-blur">
        <h1 className="text-lg font-semibold">Pesanan Saya</h1>
        <p className="text-sm text-muted">Cek status &amp; riwayat pesanan pakai nomor WA kamu.</p>
      </header>

      <div className="flex-1 px-5 py-5">
        <StatusLookup />
      </div>
    </main>
  );
}
