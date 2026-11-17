import Link from "next/link";
import { getArrearsSummary } from "@/app/actions/tunggakan";
import { ArrowLeftIcon } from "@/components/icons";
import ArrearsDashboard from "./ArrearsDashboard";

export const dynamic = "force-dynamic";

export default async function TunggakanPage() {
  const data = await getArrearsSummary();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between app-header">
        <div>
          <h1 className="text-lg font-semibold">Tunggakan</h1>
          <p className="text-sm text-muted">Siapa yang belum bayar</p>
        </div>
        <Link href="/admin" aria-label="Kembali" className="flex h-11 w-11 items-center justify-center text-muted">
          <ArrowLeftIcon />
        </Link>
      </header>

      <div className="flex-1 px-5 py-5">
        <ArrearsDashboard data={data} />
      </div>
    </main>
  );
}
