"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import { getMaxUnpaidOrders, saveMaxUnpaidOrders } from "@/lib/settings";
import { formatRupiah } from "@/lib/currency";
import { formatDateHuman } from "@/lib/date";

export type ArrearsOrder = {
  id: string;
  sessionTitle: string;
  date: string;
  nomorUrut: number;
  billAmount: number | null;
  hasProof: boolean;
};

export type ArrearsCustomer = {
  id: string;
  name: string;
  waNumber: string;
  unpaidCount: number;
  unpaidTotal: number;
  missingBillCount: number;
  oldestDate: string;
  blocked: boolean;
  orders: ArrearsOrder[];
  waUrl: string;
};

export type ArrearsSummary = {
  maxUnpaid: number;
  customers: ArrearsCustomer[];
  totalUnpaid: number;
  totalOrders: number;
  blockedCount: number;
};

function reminderUrl(name: string, waNumber: string, orders: ArrearsOrder[], total: number) {
  const lines = orders.map((o) => {
    const amount = o.billAmount != null ? formatRupiah(o.billAmount) : "harga belum ada";
    return `- ${formatDateHuman(o.date)} (${o.sessionTitle}) #${o.nomorUrut}: ${amount}`;
  });
  const message = [
    `Halo ${name}, mau ngingetin ada pesanan sarapan yang belum dibayar:`,
    ...lines,
    "",
    `Total: ${formatRupiah(total)}`,
    "Mohon dibayar & upload bukti bayarnya ya. Makasih!",
  ].join("\n");
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}

export async function getArrearsSummary(): Promise<ArrearsSummary> {
  const maxUnpaid = await getMaxUnpaidOrders();
  const customers = await prisma.customer.findMany({
    where: { orders: { some: { paid: false } } },
    include: {
      orders: {
        where: { paid: false },
        include: { session: { select: { title: true, date: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const rows: ArrearsCustomer[] = customers.map((c) => {
    const orders: ArrearsOrder[] = c.orders.map((o) => ({
      id: o.id,
      sessionTitle: o.session.title,
      date: o.session.date,
      nomorUrut: o.nomorUrut,
      billAmount: o.billAmount,
      hasProof: !!o.paymentProofPath,
    }));
    const unpaidTotal = orders.reduce((sum, o) => sum + (o.billAmount ?? 0), 0);
    return {
      id: c.id,
      name: c.name,
      waNumber: c.waNumber,
      unpaidCount: orders.length,
      unpaidTotal,
      missingBillCount: orders.filter((o) => o.billAmount == null).length,
      oldestDate: orders.reduce((min, o) => (o.date < min ? o.date : min), orders[0].date),
      blocked: maxUnpaid > 0 && orders.length >= maxUnpaid,
      orders,
      waUrl: reminderUrl(c.name, c.waNumber, orders, unpaidTotal),
    };
  });

  // Paling gawat dulu: terblokir, lalu nominal terbesar.
  rows.sort((a, b) => Number(b.blocked) - Number(a.blocked) || b.unpaidTotal - a.unpaidTotal);

  return {
    maxUnpaid,
    customers: rows,
    totalUnpaid: rows.reduce((s, c) => s + c.unpaidTotal, 0),
    totalOrders: rows.reduce((s, c) => s + c.unpaidCount, 0),
    blockedCount: rows.filter((c) => c.blocked).length,
  };
}

export async function setMaxUnpaidOrders(value: number): Promise<{ ok: true } | { error: string }> {
  if (!(await isAdminAuthenticated())) return { error: "Tidak diizinkan." };
  if (!Number.isInteger(value) || value < 0 || value > 50) {
    return { error: "Isi angka bulat 0–50 (0 = tanpa batas)." };
  }
  await saveMaxUnpaidOrders(value);
  revalidatePath("/admin/tunggakan");
  return { ok: true };
}

/** Tandai semua pesanan belum lunas milik satu pelanggan sebagai lunas. */
export async function markCustomerAllPaid(customerId: string): Promise<{ ok: true } | { error: string }> {
  if (!(await isAdminAuthenticated())) return { error: "Tidak diizinkan." };
  await prisma.order.updateMany({
    where: { customerId, paid: false },
    data: { paid: true, paidAt: new Date() },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/tunggakan");
  return { ok: true };
}
