"use server";

import { prisma } from "@/lib/prisma";
import { normalizeWaNumber, isValidWaNumber } from "@/lib/phone";

export async function getOrderListWhatsAppUrl(dayId: string): Promise<{ url: string } | { error: string }> {
  const rawNumber = process.env.WARUNG_WA_NUMBER ?? "";
  const number = normalizeWaNumber(rawNumber);
  if (!isValidWaNumber(number)) {
    return { error: "Nomor WA belum diset di .env (WARUNG_WA_NUMBER)." };
  }

  const day = await prisma.day.findUniqueOrThrow({
    where: { id: dayId },
    include: {
      orders: {
        orderBy: { nomorUrut: "asc" },
        include: { items: { include: { menuItem: true } } },
      },
    },
  });

  if (day.orders.length === 0) {
    return { error: "Belum ada pesanan hari ini." };
  }

  const message = day.orders
    .map((order) => {
      const items = order.items
        .map((item) => {
          const base = item.qty > 1 ? `${item.qty}x ${item.menuItem.name}` : item.menuItem.name;
          return item.note ? `${base} (${item.note})` : base;
        })
        .join(" + ");
      return `${order.nomorUrut}. ${items}`;
    })
    .join("\n");

  return { url: `https://wa.me/${number}?text=${encodeURIComponent(message)}` };
}
