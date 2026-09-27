"use server";

import { prisma } from "@/lib/prisma";
import { normalizeWaNumber, isValidWaNumber } from "@/lib/phone";
import { orderItemLabel } from "@/lib/orderItem";
import { formatRupiah } from "@/lib/currency";

export async function getOrderListWhatsAppUrl(sessionId: string): Promise<{ url: string } | { error: string }> {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      orders: {
        orderBy: { nomorUrut: "asc" },
        include: { items: { include: { menuItem: true } } },
      },
    },
  });

  const number = normalizeWaNumber(session.vendorWaNumber ?? "");
  if (!isValidWaNumber(number)) {
    return { error: "Nomor WA vendor belum diset untuk sesi ini." };
  }

  if (session.orders.length === 0) {
    return { error: "Belum ada pesanan di sesi ini." };
  }

  const message = session.orders
    .map((order) => {
      const items = order.items
        .map((item) => {
          const label = orderItemLabel(item);
          const base = item.qty > 1 ? `${item.qty}x ${label}` : label;
          return item.note ? `${base} (${item.note})` : base;
        })
        .join(" + ");
      return `${order.nomorUrut}. ${items}`;
    })
    .join("\n");

  return { url: `https://wa.me/${number}?text=${encodeURIComponent(message)}` };
}

export async function getUnpaidListWhatsAppUrl(sessionId: string): Promise<{ url: string } | { error: string }> {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      orders: { orderBy: { nomorUrut: "asc" } },
    },
  });

  const unpaidOrders = session.orders.filter((order) => !order.paid);
  if (unpaidOrders.length === 0) {
    return { error: "Semua pesanan sudah lunas." };
  }

  const lines = unpaidOrders.map((order) => {
    const amount = order.billAmount != null ? formatRupiah(order.billAmount) : "harga belum ada";
    return `${order.nomorUrut}. ${order.name} - ${amount}`;
  });

  const total = unpaidOrders.reduce((sum, order) => sum + (order.billAmount ?? 0), 0);
  const message = ["Belum bayar:", ...lines, "", `Total: ${formatRupiah(total)}`].join("\n");

  return { url: `https://wa.me/?text=${encodeURIComponent(message)}` };
}
