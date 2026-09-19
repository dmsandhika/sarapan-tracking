import Link from "next/link";
import { getPastDays } from "@/app/actions/history";
import { formatDateHuman } from "@/lib/date";
import { formatRupiah } from "@/lib/currency";
import { ArrowLeftIcon, ChevronRightIcon } from "@/components/icons";
import CustomerSearch from "./CustomerSearch";

export const dynamic = "force-dynamic";

export default async function RiwayatPage() {
  const pastDays = await getPastDays();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-5 pt-6 pb-4 backdrop-blur">
        <div>
          <h1 className="text-lg font-semibold">Riwayat Pesanan</h1>
          <p className="text-sm text-muted">Hari-hari sebelumnya</p>
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

          <section className="flex flex-col gap-3">
            <h2 className="section-title">Semua hari</h2>
            {pastDays.length === 0 ? (
              <p className="card text-sm text-muted">Belum ada riwayat hari sebelumnya.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {pastDays.map((day) => {
                  const belumTerkumpul = day.totalBilled - day.totalCollected;
                  return (
                    <Link
                      key={day.date}
                      href={`/admin/riwayat/${day.date}`}
                      className="card flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{formatDateHuman(day.date)}</p>
                        <p className="text-xs text-muted">{day.orderCount} pesanan</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-medium tabular-nums">{formatRupiah(day.totalBilled)}</p>
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
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
