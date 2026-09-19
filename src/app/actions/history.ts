"use server";

import { prisma } from "@/lib/prisma";
import { todayJakarta } from "@/lib/date";
import { normalizeWaNumber } from "@/lib/phone";
import type { DayWithRelations, CustomerWithOrders } from "@/app/admin/types";

export type PastDaySummary = {
  date: string;
  orderCount: number;
  totalBilled: number;
  totalCollected: number;
};

export async function getPastDays(): Promise<PastDaySummary[]> {
  const today = todayJakarta();
  const days = await prisma.day.findMany({
    where: { date: { lt: today } },
    orderBy: { date: "desc" },
    include: { orders: true },
  });

  return days
    .filter((day) => day.orders.length > 0)
    .map((day) => ({
      date: day.date,
      orderCount: day.orders.length,
      totalBilled: day.orders.reduce((sum, o) => sum + (o.billAmount ?? 0), 0),
      totalCollected: day.orders.reduce((sum, o) => sum + (o.paid ? o.billAmount ?? 0 : 0), 0),
    }));
}

export async function getDayDetail(date: string): Promise<DayWithRelations | null> {
  return prisma.day.findUnique({
    where: { date },
    include: {
      menuItems: { orderBy: { sortOrder: "asc" } },
      orders: {
        orderBy: { nomorUrut: "asc" },
        include: {
          items: { include: { menuItem: true, originalMenuItem: true } },
        },
      },
    },
  });
}

export async function searchCustomerOrders(query: string): Promise<CustomerWithOrders[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const normalizedWa = normalizeWaNumber(trimmed);

  return prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        ...(normalizedWa.length > 0 ? [{ waNumber: { contains: normalizedWa } }] : []),
      ],
    },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          day: true,
          items: { include: { menuItem: true, originalMenuItem: true } },
        },
      },
    },
    take: 10,
  });
}
