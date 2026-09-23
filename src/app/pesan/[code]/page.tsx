import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateHuman } from "@/lib/date";
import { Logo } from "@/components/Logo";
import OrderForm from "./OrderForm";

export const dynamic = "force-dynamic";

export default async function PesanSessionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await prisma.session.findUnique({
    where: { publicCode: code.toUpperCase() },
    include: { menuItems: { orderBy: { sortOrder: "asc" } } },
  });

  if (!session) notFound();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/90 px-5 pt-6 pb-4 backdrop-blur">
        <Logo size={32} />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{session.title}</h1>
          <p className="text-sm text-muted">{formatDateHuman(session.date)}</p>
        </div>
      </header>

      <div className="flex-1 px-5 py-5">
        {session.status === "DRAFT" ? (
          <div className="card flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-2xl">🍽️</span>
            <p className="text-sm text-muted">Sesi ini belum dibuka. Coba lagi nanti.</p>
          </div>
        ) : session.status !== "PUBLISHED" ? (
          <div className="card flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-2xl">🔒</span>
            <p className="text-sm text-muted">Pemesanan sesi ini sudah ditutup.</p>
          </div>
        ) : session.mode === "MENU" && session.menuItems.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-2xl">🍽️</span>
            <p className="text-sm text-muted">Menu belum di-upload. Coba lagi nanti.</p>
          </div>
        ) : session.mode === "MENU" ? (
          <OrderForm sessionId={session.id} mode="MENU" menuItems={session.menuItems} />
        ) : (
          <OrderForm sessionId={session.id} mode="FREETEXT" suggestions={session.menuItems} />
        )}
      </div>
    </main>
  );
}
