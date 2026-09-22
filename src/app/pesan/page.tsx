import Link from "next/link";
import { listPublicActiveSessions } from "@/app/actions/sessions";
import { formatDateHuman } from "@/lib/date";
import { Logo } from "@/components/Logo";
import { ChevronRightIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function PesanPickerPage() {
  const sessions = await listPublicActiveSessions();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/90 px-5 pt-6 pb-4 backdrop-blur">
        <Logo size={32} />
        <div>
          <h1 className="text-lg font-semibold">Pesan</h1>
          <p className="text-sm text-muted">Pilih sesi pemesanan yang lagi dibuka</p>
        </div>
      </header>

      <div className="flex-1 px-5 py-5">
        {sessions.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-2xl">🍽️</span>
            <p className="text-sm text-muted">Belum ada sesi pemesanan yang dibuka. Coba lagi nanti.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((session) => (
              <Link
                key={session.publicCode}
                href={`/pesan/${session.publicCode}`}
                className="card flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{session.title}</p>
                  <p className="text-xs text-muted">{formatDateHuman(session.date)}</p>
                </div>
                <ChevronRightIcon className="shrink-0 text-muted" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
