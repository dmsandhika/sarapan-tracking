import { prisma } from "@/lib/prisma";
import { todayJakarta, formatDateHuman } from "@/lib/date";
import OrderForm from "./OrderForm";

export default async function PesanPage() {
  const date = todayJakarta();
  const day = await prisma.day.findUnique({
    where: { date },
    include: { menuItems: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-5 pt-6 pb-4 backdrop-blur">
        <h1 className="text-lg font-semibold">Pesan Sarapan</h1>
        <p className="text-sm text-muted">{formatDateHuman(date)}</p>
      </header>

      <div className="flex-1 px-5 py-5">
        {!day || day.menuItems.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-2xl">🍽️</span>
            <p className="text-sm text-muted">Menu hari ini belum di-upload. Coba lagi nanti.</p>
          </div>
        ) : day.status !== "PUBLISHED" ? (
          <div className="card flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-2xl">🔒</span>
            <p className="text-sm text-muted">Pemesanan hari ini sudah ditutup.</p>
          </div>
        ) : (
          <OrderForm dayId={day.id} menuItems={day.menuItems} />
        )}
      </div>
    </main>
  );
}
