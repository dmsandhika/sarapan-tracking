"use server";

import { prisma } from "@/lib/prisma";
import { normalizeWaNumber } from "@/lib/phone";
import type { CustomerWithOrders } from "@/app/admin/types";

export type PastSessionSummary = {
  id: string;
  title: string;
  mode: string;
  orderCount: number;
  totalBilled: number;
  totalCollected: number;
  allPaid: boolean;
};

export type PastSessionsGroup = {
  date: string;
  sessions: PastSessionSummary[];
};

export async function getPastSessionsGroupedByDate(): Promise<PastSessionsGroup[]> {
  // /admin now lists every session too (closed ones sink to the bottom), so
  // this page is a CLOSED-only cross-section of the same data, grouped and
  // sorted by date for browsing history rather than the "what's live" view.
  const sessions = await prisma.session.findMany({
    where: { status: "CLOSED" },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { orders: true },
  });

  const groups = new Map<string, PastSessionSummary[]>();
  for (const session of sessions) {
    if (session.orders.length === 0) continue;
    const summary: PastSessionSummary = {
      id: session.id,
      title: session.title,
      mode: session.mode,
      orderCount: session.orders.length,
      totalBilled: session.orders.reduce((sum, o) => sum + (o.billAmount ?? 0), 0),
      totalCollected: session.orders.reduce((sum, o) => sum + (o.paid ? o.billAmount ?? 0 : 0), 0),
      allPaid: session.orders.every((o) => o.paid),
    };
    const list = groups.get(session.date) ?? [];
    list.push(summary);
    groups.set(session.date, list);
  }

  return Array.from(groups.entries()).map(([date, sessions]) => ({ date, sessions }));
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
          session: true,
          items: { include: { menuItem: true, originalMenuItem: true } },
        },
      },
    },
    take: 10,
  });
}
