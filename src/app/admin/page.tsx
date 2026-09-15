import { prisma } from "@/lib/prisma";
import { todayJakarta, formatDateHuman } from "@/lib/date";
import { logoutAdmin } from "@/app/actions/admin";
import UploadMenuForm from "./UploadMenuForm";
import DayDashboard from "./DayDashboard";

export default async function AdminPage() {
  const date = todayJakarta();

  const day = await prisma.day.findUnique({
    where: { date },
    include: {
      menuItems: { orderBy: { sortOrder: "asc" } },
      orders: {
        orderBy: { nomorUrut: "asc" },
        include: {
          items: {
            include: { menuItem: true, originalMenuItem: true },
          },
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Admin Sarapan</h1>
          <p className="text-sm text-black/60">{formatDateHuman(date)}</p>
        </div>
        <form action={logoutAdmin}>
          <button className="text-sm text-black/50 underline">Keluar</button>
        </form>
      </div>

      {!day || day.menuItems.length === 0 ? (
        <UploadMenuForm />
      ) : (
        <DayDashboard day={day} />
      )}
    </main>
  );
}
