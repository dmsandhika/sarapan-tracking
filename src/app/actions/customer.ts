"use server";

import { prisma } from "@/lib/prisma";
import { normalizeWaNumber, isValidWaNumber } from "@/lib/phone";

export type CustomerOrderHistory = {
  customerName: string;
  orders: {
    id: string;
    date: string;
    nomorUrut: number;
    paid: boolean;
    billAmount: number | null;
    items: {
      id: string;
      qty: number;
      name: string;
      originalName: string | null;
      note: string | null;
    }[];
  }[];
};

export async function getOrderHistory(
  waNumberInput: string
): Promise<CustomerOrderHistory | { error: string }> {
  const waNumber = normalizeWaNumber(waNumberInput);
  if (!isValidWaNumber(waNumber)) {
    return { error: "Nomor WA tidak valid." };
  }

  const customer = await prisma.customer.findUnique({
    where: { waNumber },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          day: true,
          items: { include: { menuItem: true, originalMenuItem: true } },
        },
      },
    },
  });

  if (!customer) {
    return { error: "Belum ada pesanan dengan nomor WA ini." };
  }

  return {
    customerName: customer.name,
    orders: customer.orders.map((order) => ({
      id: order.id,
      date: order.day.date,
      nomorUrut: order.nomorUrut,
      paid: order.paid,
      billAmount: order.billAmount,
      items: order.items.map((item) => ({
        id: item.id,
        qty: item.qty,
        name: item.menuItem.name,
        originalName: item.originalMenuItem?.name ?? null,
        note: item.note,
      })),
    })),
  };
}
