import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionWithRelations } from "@/app/actions/sessions";
import { formatDateHuman } from "@/lib/date";
import { ArrowLeftIcon } from "@/components/icons";
import OrdersList from "@/app/admin/OrdersList";
import BillUploadForm from "@/app/admin/BillUploadForm";
import DaySummary from "@/app/admin/DaySummary";

export const dynamic = "force-dynamic";

export default async function RiwayatDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await getSessionWithRelations(sessionId);

  if (!session) notFound();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-5 pt-6 pb-4 backdrop-blur">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{session.title}</h1>
          <p className="text-sm text-muted">{formatDateHuman(session.date)}</p>
        </div>
        <Link
          href="/admin/riwayat"
          aria-label="Kembali"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-muted"
        >
          <ArrowLeftIcon />
        </Link>
      </header>

      <div className="flex-1 px-5 py-5">
        <div className="flex flex-col gap-6">
          {session.mode === "MENU" && (
            <section className="flex flex-col gap-3">
              <h2 className="section-title">Menu sesi itu</h2>
              <div className="rounded-card border border-border px-3">
                {session.menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-border px-1 py-3 last:border-b-0"
                  >
                    <span className={item.status === "HABIS" ? "text-muted line-through" : "text-sm"}>
                      {item.name}
                    </span>
                    {item.status === "HABIS" && (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                        Habis
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <BillUploadForm sessionId={session.id} />

          <OrdersList orders={session.orders} menuItems={session.menuItems} allowSubstitution={false} />

          <DaySummary orders={session.orders} />
        </div>
      </div>
    </main>
  );
}
