import Link from "next/link";
import { getAnalyticsSummary } from "@/app/actions/analytics";
import { ArrowLeftIcon } from "@/components/icons";
import AnalyticsDashboard from "./AnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getAnalyticsSummary();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-5 pt-6 pb-4 backdrop-blur">
        <div>
          <h1 className="text-lg font-semibold">Analytics</h1>
          <p className="text-sm text-muted">Semua sesi</p>
        </div>
        <Link
          href="/admin/riwayat"
          aria-label="Kembali"
          className="flex h-11 w-11 items-center justify-center text-muted"
        >
          <ArrowLeftIcon />
        </Link>
      </header>

      <div className="flex-1 px-5 py-5">
        <AnalyticsDashboard data={data} />
      </div>
    </main>
  );
}
