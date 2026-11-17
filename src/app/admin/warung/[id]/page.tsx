import Link from "next/link";
import { notFound } from "next/navigation";
import { getWarung } from "@/app/actions/warung";
import { ArrowLeftIcon } from "@/components/icons";
import WarungDetail from "./WarungDetail";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // baca foto menu via Gemini bisa beberapa detik

export default async function WarungDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const warung = await getWarung(id);
  if (!warung) notFound();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between app-header">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{warung.name}</h1>
          <p className="text-sm text-muted">{warung.items.length} lauk tersimpan</p>
        </div>
        <Link href="/admin/warung" aria-label="Kembali" className="flex h-11 w-11 shrink-0 items-center justify-center text-muted">
          <ArrowLeftIcon />
        </Link>
      </header>

      <div className="flex-1 px-5 py-5">
        <WarungDetail
          warung={{ id: warung.id, name: warung.name, waNumber: warung.waNumber, note: warung.note }}
          items={warung.items.map((i) => ({ id: i.id, name: i.name, price: i.price }))}
        />
      </div>
    </main>
  );
}
