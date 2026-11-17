import Link from "next/link";
import { listWarungs } from "@/app/actions/warung";
import { ArrowLeftIcon } from "@/components/icons";
import CreateWarungForm from "./CreateWarungForm";

export const dynamic = "force-dynamic";

export default async function WarungListPage() {
  const warungs = await listWarungs();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between app-header">
        <div>
          <h1 className="text-lg font-semibold">Warung</h1>
          <p className="text-sm text-muted">Daftar warung &amp; lauknya</p>
        </div>
        <Link href="/admin" aria-label="Kembali" className="flex h-11 w-11 items-center justify-center text-muted">
          <ArrowLeftIcon />
        </Link>
      </header>

      <div className="flex-1 px-5 py-5">
        <div className="flex flex-col gap-6">
          <CreateWarungForm />
          <section className="flex flex-col gap-3">
            <h2 className="section-title">Semua warung ({warungs.length})</h2>
            {warungs.length === 0 ? (
              <div className="card flex flex-col items-center gap-2 py-10 text-center">
                <span className="text-2xl">🍚</span>
                <p className="text-sm text-muted">Belum ada warung. Tambah satu dulu, lalu isi lauknya.</p>
              </div>
            ) : (
              warungs.map((w) => (
                <Link key={w.id} href={`/admin/warung/${w.id}`} className="card flex min-h-11 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{w.name}</p>
                    <p className="text-xs text-muted">{w.waNumber ?? "Nomor WA belum diisi"}</p>
                  </div>
                  <span className="badge shrink-0 bg-primary-soft text-primary">{w.itemCount} lauk</span>
                </Link>
              ))
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
