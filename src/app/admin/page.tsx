import Link from "next/link";
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
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-5 pt-6 pb-4 backdrop-blur">
        <div>
          <h1 className="text-lg font-semibold">Admin Sarapan</h1>
          <p className="text-sm text-muted">{formatDateHuman(date)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/riwayat" className="btn-ghost">
            Riwayat
          </Link>
          <form action={logoutAdmin}>
            <button className="btn-ghost">Keluar</button>
          </form>
        </div>
      </header>

      <div className="flex-1 px-5 py-5">
        {!day || day.menuItems.length === 0 ? (
          <UploadMenuForm />
        ) : (
          <DayDashboard day={day} />
        )}
      </div>
    </main>
  );
}
