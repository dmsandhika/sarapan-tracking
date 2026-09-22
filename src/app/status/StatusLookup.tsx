"use client";

import { useEffect, useState, useTransition } from "react";
import { getOrderHistory, type CustomerOrderHistory } from "@/app/actions/customer";
import { formatRupiah } from "@/lib/currency";
import { formatDateHuman, todayJakarta } from "@/lib/date";

const PROFILE_KEY = "sarapan-tracking:profile";

function OrderCard({ order }: { order: CustomerOrderHistory["orders"][number] }) {
  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
            {order.nomorUrut}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{order.sessionTitle}</p>
            <p className="text-xs text-muted">{formatDateHuman(order.date)}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-sm font-medium ${
            order.paid ? "text-success" : "text-muted"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${order.paid ? "bg-success" : "bg-muted"}`} />
          {order.paid ? "Lunas" : "Belum bayar"}
        </span>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-2 text-sm">
        {order.items.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center gap-2">
            <span>
              {item.qty}x {item.name}
            </span>
            {item.originalName && (
              <span className="text-xs text-warning">diganti dari {item.originalName}</span>
            )}
            {item.note && <span className="text-xs text-muted">({item.note})</span>}
          </div>
        ))}
      </div>

      {order.billAmount != null && (
        <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-medium">
          <span>Tagihan</span>
          <span className="tabular-nums">{formatRupiah(order.billAmount)}</span>
        </div>
      )}
    </div>
  );
}

export default function StatusLookup() {
  const [waNumber, setWaNumber] = useState("");
  const [result, setResult] = useState<CustomerOrderHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  function search(value: string) {
    if (value.trim().length === 0) return;
    setError(null);
    startTransition(async () => {
      const res = await getOrderHistory(value.trim());
      setHasSearched(true);
      if ("error" in res) {
        setError(res.error);
        setResult(null);
      } else {
        setResult(res);
      }
    });
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        const profile = JSON.parse(saved) as { waNumber?: string };
        if (profile.waNumber) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydrate from localStorage on mount
          setWaNumber(profile.waNumber);
          search(profile.waNumber);
        }
      }
    } catch {
      // ignore malformed/unavailable storage
    }
  }, []);

  const today = todayJakarta();
  const todayOrders = result?.orders.filter((o) => o.date === today) ?? [];
  const historyOrders = result?.orders.filter((o) => o.date !== today) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(waNumber);
        }}
        className="flex gap-2"
      >
        <input
          value={waNumber}
          onChange={(e) => setWaNumber(e.target.value)}
          placeholder="Nomor WA"
          inputMode="tel"
          className="field-input flex-1"
        />
        <button type="submit" disabled={isPending} className="btn-primary px-4">
          {isPending ? "Cari..." : "Cek"}
        </button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      {result && (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="section-title">Hari ini</h2>
            {todayOrders.length === 0 ? (
              <p className="card text-sm text-muted">Belum ada pesanan hari ini.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {todayOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </section>

          {historyOrders.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="section-title">Riwayat</h2>
              <div className="flex flex-col gap-4">
                {historyOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {!result && !error && hasSearched === false && !isPending && (
        <p className="text-sm text-muted">Masukkan nomor WA yang dipakai saat pesan sarapan.</p>
      )}
    </div>
  );
}
