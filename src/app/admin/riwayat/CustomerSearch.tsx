"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { searchCustomerOrders } from "@/app/actions/history";
import { toggleOrderPaid, setOrderBillAmount } from "@/app/actions/admin";
import { formatRupiah } from "@/lib/currency";
import { formatDateHuman } from "@/lib/date";
import { ChevronRightIcon } from "@/components/icons";
import { orderItemLabel } from "@/lib/orderItem";
import type { CustomerWithOrders } from "../types";

function BillAmountCell({ orderId, initial }: { orderId: string; initial: number | null }) {
  const [value, setValue] = useState(initial?.toString() ?? "");
  const [isPending, startTransition] = useTransition();

  function save() {
    const amount = value.trim() === "" ? null : Number(value);
    if (amount !== null && Number.isNaN(amount)) return;
    startTransition(() => setOrderBillAmount(orderId, amount));
  }

  return (
    <input
      type="number"
      value={value}
      disabled={isPending}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      placeholder="Rp"
      className="field-input min-h-9 w-28 rounded-control text-right text-sm tabular-nums"
    />
  );
}

function CustomerCard({ customer }: { customer: CustomerWithOrders }) {
  const [isPending, startTransition] = useTransition();
  const totalBilled = customer.orders.reduce((sum, o) => sum + (o.billAmount ?? 0), 0);
  const totalUnpaid = customer.orders.reduce(
    (sum, o) => sum + (!o.paid ? o.billAmount ?? 0 : 0),
    0
  );

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{customer.name}</p>
          <p className="text-xs text-muted">{customer.waNumber}</p>
        </div>
        {totalUnpaid > 0 && (
          <span className="shrink-0 text-sm font-medium tabular-nums text-danger">
            Belum bayar {formatRupiah(totalUnpaid)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-3">
        {customer.orders.map((order) => (
          <div key={order.id} className="flex flex-col gap-2 rounded-card border border-border p-2">
            <Link
              href={`/admin/riwayat/${order.sessionId}`}
              className="inline-flex items-center gap-1 text-sm text-muted"
            >
              #{order.nomorUrut} · {order.session.title} · {formatDateHuman(order.session.date)}
              <ChevronRightIcon className="text-muted" />
            </Link>
            <div className="flex items-center gap-3">
              <BillAmountCell key={order.billAmount} orderId={order.id} initial={order.billAmount} />
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(() => toggleOrderPaid(order.id))}
                className={`inline-flex min-h-11 items-center gap-1.5 text-sm font-medium ${
                  order.paid ? "text-success" : "text-muted"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${order.paid ? "bg-success" : "bg-muted"}`} />
                {order.paid ? "Lunas" : "Belum bayar"}
              </button>
            </div>
            <p className="text-sm text-muted">
              {order.items.map((it) => `${it.qty}x ${orderItemLabel(it)}`).join(", ")}
            </p>
          </div>
        ))}
      </div>

      {totalBilled > 0 && (
        <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-medium">
          <span>Total semua pesanan</span>
          <span className="tabular-nums">{formatRupiah(totalBilled)}</span>
        </div>
      )}
    </div>
  );
}

export default function CustomerSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerWithOrders[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length === 0) return;
    startTransition(async () => {
      const res = await searchCustomerOrders(query);
      setResults(res);
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="section-title">Cari customer</h2>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nama atau nomor WA"
          className="field-input flex-1"
        />
        <button type="submit" disabled={isPending} className="btn-primary px-4">
          {isPending ? "Cari..." : "Cari"}
        </button>
      </form>

      {results && results.length === 0 && (
        <p className="card text-sm text-muted">Tidak ketemu customer dengan kata kunci itu.</p>
      )}

      {results && results.length > 0 && (
        <div className="flex flex-col gap-4">
          {results.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}
    </section>
  );
}
