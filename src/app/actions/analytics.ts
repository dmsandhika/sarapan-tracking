"use server";

import { prisma } from "@/lib/prisma";
import { jakartaDateString } from "@/lib/date";
import { orderItemLabel } from "@/lib/orderItem";

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAY_MS = 24 * 60 * 60 * 1000;

export type AnalyticsSummary = {
  sessionCount: number;
  orderCount: number;
  avgOrdersPerSession: number;
  totalBilled: number;
  totalCollected: number;
  paidCount: number;
  paidRate: number;
  activeCustomerCount: number;
  newCustomerCount: number;
  dailyOrders: { date: string; label: string; count: number }[];
  topItems: { name: string; qty: number }[];
  topCustomers: { name: string; orderCount: number }[];
  unpaidTotal: number;
  unpaidOrderCount: number;
  unpaidSessionCount: number;
};

// Every field below is derived from just 4 round trips (one per table that
// matters), each one a bulk fetch aggregated in JS, instead of ~14 narrow
// queries — this DB's per-query latency dominates load time far more than
// the in-process aggregation cost ever could at this app's data scale.
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 6 * DAY_MS);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

  const [sessionCount, orders, items, customers] = await Promise.all([
    prisma.session.count(),
    prisma.order.findMany({
      select: { billAmount: true, paid: true, sessionId: true, createdAt: true, customer: { select: { name: true } } },
    }),
    prisma.orderItem.findMany({
      select: { qty: true, customText: true, menuItem: { select: { name: true } } },
    }),
    prisma.customer.findMany({ select: { createdAt: true } }),
  ]);

  let totalBilled = 0;
  let totalCollected = 0;
  let paidCount = 0;
  let unpaidTotal = 0;
  let unpaidOrderCount = 0;
  const unpaidSessionIds = new Set<string>();
  const customerOrderCounts = new Map<string, number>();

  const dailyOrders: AnalyticsSummary["dailyOrders"] = [];
  for (let i = 6; i >= 0; i--) {
    const dateStr = jakartaDateString(new Date(now.getTime() - i * DAY_MS));
    const weekday = new Date(`${dateStr}T00:00:00+07:00`).getUTCDay();
    dailyOrders.push({ date: dateStr, label: DAY_LABELS[weekday], count: 0 });
  }
  const dayIndex = new Map(dailyOrders.map((d, i) => [d.date, i]));

  for (const order of orders) {
    const amount = order.billAmount ?? 0;
    totalBilled += amount;
    if (order.paid) {
      totalCollected += amount;
      paidCount++;
    } else {
      unpaidTotal += amount;
      unpaidOrderCount++;
      unpaidSessionIds.add(order.sessionId);
    }

    const name = order.customer.name;
    customerOrderCounts.set(name, (customerOrderCounts.get(name) ?? 0) + 1);

    if (order.createdAt >= sevenDaysAgo) {
      const idx = dayIndex.get(jakartaDateString(order.createdAt));
      if (idx !== undefined) dailyOrders[idx].count++;
    }
  }

  const orderCount = orders.length;
  const topCustomers = Array.from(customerOrderCounts.entries())
    .map(([name, orderCount]) => ({ name, orderCount }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5);

  const itemQty = new Map<string, number>();
  for (const item of items) {
    const label = orderItemLabel(item);
    itemQty.set(label, (itemQty.get(label) ?? 0) + item.qty);
  }
  const topItems = Array.from(itemQty.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const newCustomerCount = customers.filter((c) => c.createdAt >= thirtyDaysAgo).length;

  return {
    sessionCount,
    orderCount,
    avgOrdersPerSession: sessionCount > 0 ? Math.round(orderCount / sessionCount) : 0,
    totalBilled,
    totalCollected,
    paidCount,
    paidRate: orderCount > 0 ? Math.round((paidCount / orderCount) * 100) : 0,
    activeCustomerCount: customers.length,
    newCustomerCount,
    dailyOrders,
    topItems,
    topCustomers,
    unpaidTotal,
    unpaidOrderCount,
    unpaidSessionCount: unpaidSessionIds.size,
  };
}
