import Link from "next/link";
import { getPastSessionsGroupedByDate } from "@/app/actions/history";
import { formatDateHuman } from "@/lib/date";
import { formatRupiah } from "@/lib/currency";
import { ArrowLeftIcon, ChevronRightIcon } from "@/components/icons";
import CustomerSearch from "./CustomerSearch";

export const dynamic = "force-dynamic";

export default async function RiwayatPage() {
  const groups = await getPastSessionsGroupedByDate();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-5 pt-6 pb-4 backdrop-blur">
        <div>
          <h1 className="text-lg font-semibold">Riwayat Pesanan</h1>
          <p className="text-sm text-muted">Sesi-sesi sebelumnya</p>
        </div>
        <Link
          href="/admin"
          aria-label="Kembali"
          className="flex h-11 w-11 items-center justify-center text-muted"
        >
          <ArrowLeftIcon />
        </Link>
      </header>

      <div className="flex-1 px-5 py-5">
        <div className="flex flex-col gap-6">
          <CustomerSearch />

          <section className="flex flex-col gap-4">
            <h2 className="section-title">Semua sesi</h2>
            {groups.length === 0 ? (
              <p className="card text-sm text-muted">Belum ada riwayat sesi sebelumnya.</p>
            ) : (
              groups.map((group) => (
                <div key={group.date} className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted">{formatDateHuman(group.date)}</p>
                  <div className="flex flex-col gap-3">
                    {group.sessions.map((session) => {
                      const belumTerkumpul = session.totalBilled - session.totalCollected;
                      return (
                        <Link
                          key={session.id}
                          href={`/admin/riwayat/${session.id}`}
                          className="card flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{session.title}</p>
                            <p className="text-xs text-muted">{session.orderCount} pesanan</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-sm font-medium tabular-nums">
                                {formatRupiah(session.totalBilled)}
                              </p>
                              {belumTerkumpul > 0 ? (
                                <p className="text-xs tabular-nums text-danger">
                                  Belum terkumpul {formatRupiah(belumTerkumpul)}
                                </p>
                              ) : (
                                <p className="text-xs text-success">Lunas semua</p>
                              )}
                            </div>
                            <ChevronRightIcon className="shrink-0 text-muted" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
