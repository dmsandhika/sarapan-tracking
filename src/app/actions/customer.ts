"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { normalizeWaNumber, isValidWaNumber } from "@/lib/phone";
import { orderItemLabel } from "@/lib/orderItem";
import { jakartaDateString } from "@/lib/date";

export type CustomerOrderHistory = {
  customerName: string;
  stats: {
    totalOrders: number;
    ordersThisMonth: number;
    totalSpent: number;
    unpaidTotal: number;
    unpaidCount: number;
    favoriteItem: string | null;
  };
  orders: {
    id: string;
    date: string;
    sessionId: string;
    sessionTitle: string;
    nomorUrut: number;
    paid: boolean;
    billAmount: number | null;
    items: {
      id: string;
      qty: number;
      name: string;
      originalName: string | null;
      note: string | null;
      needsSubstitution: boolean;
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
          session: true,
          items: { include: { menuItem: true, originalMenuItem: true } },
        },
      },
    },
  });

  if (!customer) {
    return { error: "Belum ada pesanan dengan nomor WA ini." };
  }

  const currentMonth = jakartaDateString(new Date()).slice(0, 7);
  let ordersThisMonth = 0;
  let totalSpent = 0;
  let unpaidTotal = 0;
  let unpaidCount = 0;
  const itemQty = new Map<string, number>();

  for (const order of customer.orders) {
    if (jakartaDateString(order.createdAt).slice(0, 7) === currentMonth) {
      ordersThisMonth++;
    }
    if (order.paid) {
      totalSpent += order.billAmount ?? 0;
    } else {
      unpaidTotal += order.billAmount ?? 0;
      unpaidCount++;
    }
    for (const item of order.items) {
      const label = orderItemLabel(item);
      itemQty.set(label, (itemQty.get(label) ?? 0) + item.qty);
    }
  }

  let favoriteItem: string | null = null;
  let favoriteQty = 0;
  for (const [label, qty] of itemQty) {
    if (qty > favoriteQty) {
      favoriteItem = label;
      favoriteQty = qty;
    }
  }

  return {
    customerName: customer.name,
    stats: {
      totalOrders: customer.orders.length,
      ordersThisMonth,
      totalSpent,
      unpaidTotal,
      unpaidCount,
      favoriteItem,
    },
    orders: customer.orders.map((order) => ({
      id: order.id,
      date: order.session.date,
      sessionId: order.sessionId,
      sessionTitle: order.session.title,
      nomorUrut: order.nomorUrut,
      paid: order.paid,
      billAmount: order.billAmount,
      items: order.items.map((item) => ({
        id: item.id,
        qty: item.qty,
        name: orderItemLabel(item),
        originalName: item.originalMenuItem?.name ?? null,
        note: item.note,
        needsSubstitution:
          item.menuItem?.status === "HABIS" && !order.paid && order.session.status === "PUBLISHED",
      })),
    })),
  };
}

export async function listSubstituteOptions(orderItemId: string): Promise<{ id: string; name: string }[]> {
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { menuItem: true },
  });
  if (!item?.menuItem) return [];

  return prisma.menuItem.findMany({
    where: { sessionId: item.menuItem.sessionId, status: "AVAILABLE" },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function customerSubstituteOrderItem(
  waNumberInput: string,
  orderItemId: string,
  newMenuItemId: string
): Promise<{ error?: string }> {
  const waNumber = normalizeWaNumber(waNumberInput);
  if (!isValidWaNumber(waNumber)) {
    return { error: "Nomor WA tidak valid." };
  }

  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: { include: { customer: true, session: true } }, menuItem: true },
  });
  if (!item) {
    return { error: "Item pesanan tidak ditemukan." };
  }
  if (item.order.customer.waNumber !== waNumber) {
    return { error: "Nomor WA tidak cocok dengan pesanan ini." };
  }
  if (item.order.paid) {
    return { error: "Pesanan ini sudah lunas, tidak bisa diganti lagi. Hubungi admin kalau masih perlu diganti." };
  }
  if (item.order.session.status !== "PUBLISHED") {
    return { error: "Sesi ini sudah ditutup, tidak bisa ganti menu lagi." };
  }
  if (!item.menuItem || item.menuItem.status !== "HABIS") {
    return { error: "Item ini belum ditandai habis." };
  }

  const replacement = await prisma.menuItem.findUnique({ where: { id: newMenuItemId } });
  if (!replacement || replacement.sessionId !== item.menuItem.sessionId || replacement.status !== "AVAILABLE") {
    return { error: "Menu pengganti tidak valid." };
  }

  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      originalMenuItemId: item.originalMenuItemId ?? item.menuItemId,
      menuItemId: newMenuItemId,
    },
  });
  revalidatePath("/status");
  return {};
}
