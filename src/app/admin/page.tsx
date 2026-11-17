import Link from "next/link";
import { logoutAdmin } from "@/app/actions/admin";
import { listSessionsForAdmin } from "@/app/actions/sessions";
import { listWarungsForSessionForm } from "@/app/actions/warung";
import { HistoryIcon, LogOutIcon, StoreIcon, WalletIcon } from "@/components/icons";
import CreateSessionForm from "./CreateSessionForm";
import SessionList from "./SessionList";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // extraction via Gemini can take a few seconds

export default async function AdminPage() {
  const [sessions, warungs] = await Promise.all([listSessionsForAdmin(), listWarungsForSessionForm()]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between app-header">
        <div>
          <h1 className="text-lg font-semibold">Admin Jompesan</h1>
          <p className="text-sm text-muted">Semua sesi, hari ini &amp; aktif di atas</p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/admin/warung"
            aria-label="Warung"
            className="flex h-11 w-11 items-center justify-center text-muted"
          >
            <StoreIcon />
          </Link>
          <Link
            href="/admin/tunggakan"
            aria-label="Tunggakan"
            className="flex h-11 w-11 items-center justify-center text-muted"
          >
            <WalletIcon />
          </Link>
          <Link
            href="/admin/riwayat"
            aria-label="Riwayat"
            className="flex h-11 w-11 items-center justify-center text-muted"
          >
            <HistoryIcon />
          </Link>
          <form action={logoutAdmin}>
            <button type="submit" aria-label="Keluar" className="flex h-11 w-11 items-center justify-center text-muted">
              <LogOutIcon />
            </button>
          </form>
        </div>
      </header>

      <div className="flex-1 px-5 py-5">
        <div className="flex flex-col gap-6">
          <CreateSessionForm defaultVendorWaNumber={process.env.WARUNG_WA_NUMBER ?? ""} warungs={warungs} />
          <SessionList sessions={sessions} />
        </div>
      </div>
    </main>
  );
}
