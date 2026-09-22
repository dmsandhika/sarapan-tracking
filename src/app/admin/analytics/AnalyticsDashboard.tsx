"use client";

import { motion } from "framer-motion";
import { formatRupiah } from "@/lib/currency";
import type { AnalyticsSummary } from "@/app/actions/analytics";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
};

export default function AnalyticsDashboard({ data }: { data: AnalyticsSummary }) {
  const maxDaily = Math.max(1, ...data.dailyOrders.map((d) => d.count));
  const todayDate = data.dailyOrders[data.dailyOrders.length - 1]?.date;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-4">
      <motion.div variants={container} className="grid grid-cols-2 gap-3">
        <motion.div variants={item} className="card">
          <p className="text-xs text-muted">Total tagihan</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{formatRupiah(data.totalBilled)}</p>
          <p className="mt-0.5 text-xs text-muted">dari {data.sessionCount} sesi</p>
        </motion.div>
        <motion.div variants={item} className="card">
          <p className="text-xs text-muted">Pesanan</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{data.orderCount}</p>
          <p className="mt-0.5 text-xs text-muted">rata-rata {data.avgOrdersPerSession}/sesi</p>
        </motion.div>
        <motion.div variants={item} className="card">
          <p className="text-xs text-muted">Tingkat lunas</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-success">{data.paidRate}%</p>
          <p className="mt-0.5 text-xs text-muted">
            {data.paidCount} dari {data.orderCount} lunas
          </p>
        </motion.div>
        <motion.div variants={item} className="card">
          <p className="text-xs text-muted">Pelanggan aktif</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{data.activeCustomerCount}</p>
          <p className="mt-0.5 text-xs text-muted">{data.newCustomerCount} orang baru</p>
        </motion.div>
      </motion.div>

      <motion.section variants={item} className="card">
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Pesanan 7 hari terakhir
        </h2>
        <div className="flex h-14 items-end gap-2">
          {data.dailyOrders.map((day, index) => (
            <div key={day.date} className="flex flex-1 flex-col items-center justify-end gap-1.5">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(4, (day.count / maxDaily) * 56)}px` }}
                transition={{ delay: 0.35 + index * 0.05, type: "spring", stiffness: 200, damping: 20 }}
                className={`w-full rounded-t ${day.date === todayDate ? "bg-primary" : "bg-primary-soft"}`}
              />
              <span className={`text-[10px] ${day.date === todayDate ? "font-semibold text-primary" : "text-muted"}`}>
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={item} className="flex flex-col gap-2">
        <h2 className="section-title">Menu favorit</h2>
        <div className="rounded-card border border-border px-3.5">
          {data.topItems.length === 0 ? (
            <p className="py-3 text-sm text-muted">Belum ada data pesanan.</p>
          ) : (
            data.topItems.map((menuItem, index) => (
              <div
                key={menuItem.name}
                className="flex items-center gap-2.5 border-b border-border py-2.5 last:border-b-0"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="flex-1 truncate text-sm">{menuItem.name}</span>
                <span className="text-xs tabular-nums text-muted">{menuItem.qty}x</span>
              </div>
            ))
          )}
        </div>
      </motion.section>

      <motion.section variants={item} className="flex flex-col gap-2">
        <h2 className="section-title">Paling sering pesan</h2>
        <div className="rounded-card border border-border px-3.5">
          {data.topCustomers.length === 0 ? (
            <p className="py-3 text-sm text-muted">Belum ada data pesanan.</p>
          ) : (
            data.topCustomers.map((customer, index) => (
              <div
                key={`${customer.name}-${index}`}
                className="flex items-center gap-2.5 border-b border-border py-2.5 last:border-b-0"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[11px] font-semibold text-muted">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 truncate text-sm">{customer.name}</span>
                <span className="text-xs tabular-nums text-muted">{customer.orderCount}x pesan</span>
              </div>
            ))
          )}
        </div>
      </motion.section>

      {data.unpaidOrderCount > 0 && (
        <motion.div
          variants={item}
          className="flex items-center justify-between rounded-card bg-danger-soft px-4 py-3.5"
        >
          <div>
            <p className="text-xs font-semibold text-danger">Belum terkumpul</p>
            <p className="text-xs text-danger/80">
              {data.unpaidOrderCount} pesanan di {data.unpaidSessionCount} sesi
            </p>
          </div>
          <p className="text-lg font-bold tabular-nums text-danger">{formatRupiah(data.unpaidTotal)}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
