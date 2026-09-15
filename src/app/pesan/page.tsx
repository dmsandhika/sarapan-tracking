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
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold">Pesan Sarapan</h1>
      <p className="mb-6 text-sm text-black/60">{formatDateHuman(date)}</p>

      {!day || day.menuItems.length === 0 ? (
        <p className="text-sm text-black/60">Menu hari ini belum di-upload. Coba lagi nanti.</p>
      ) : day.status !== "PUBLISHED" ? (
        <p className="text-sm text-black/60">Pemesanan hari ini sudah ditutup.</p>
      ) : (
        <OrderForm dayId={day.id} menuItems={day.menuItems} />
      )}
    </main>
  );
}
