"use client";

import { useState, useTransition } from "react";
import { markCustomerAllPaid, setMaxUnpaidOrders, type ArrearsCustomer, type ArrearsSummary } from "@/app/actions/tunggakan";
import { formatRupiah } from "@/lib/currency";
import { formatDateHuman } from "@/lib/date";

function LimitSetting({ initial }: { initial: number }) {
  const [value, setValue] = useState(String(initial));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setMsg(null);
    startTransition(async () => {
      const result = await setMaxUnpaidOrders(Number(value));
      setMsg("error" in result ? { ok: false, text: result.error } : { ok: true, text: "Tersimpan." });
    });
  }

  return (
    <div className="card flex flex-col gap-3">
      <div>
        <h2 className="section-title">Batas pesanan belum bayar</h2>
        <p className="text-sm text-muted">
          Pelanggan dengan pesanan belum lunas sebanyak ini tidak bisa pesan lagi. Isi 0 untuk tanpa batas.
        </p>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={50}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="field-input"
          aria-label="Batas pesanan belum bayar"
        />
        <button type="button" onClick={save} disabled={isPending} className="btn-primary shrink-0">
          {isPending ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
    </div>
  );
}

function CustomerRow({ customer }: { customer: ArrearsCustomer }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="card flex flex-col gap-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-h-11 items-center justify-between gap-3 text-left">
        <div className="min-w-0">
          <p className="truncate font-bold">{customer.name}</p>
          <p className="text-xs text-muted">
            {customer.unpaidCount} pesanan · sejak {formatDateHuman(customer.oldestDate)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-display text-lg font-bold tabular-nums text-danger">
            {formatRupiah(customer.unpaidTotal)}
          </span>
          {customer.blocked && <span className="badge bg-danger-soft text-danger">Terblokir</span>}
        </div>
      </button>

      {customer.missingBillCount > 0 && (
        <p className="text-xs text-warning">{customer.missingBillCount} pesanan belum ada harga (belum masuk total).</p>
      )}

      {open && (
        <div className="flex flex-col border-t border-line pt-1">
          {customer.orders.map((o) => (
            <div key={o.id} className="list-row text-sm">
              <div className="min-w-0">
                <p className="truncate">
                  #{o.nomorUrut} · {o.sessionTitle}
                </p>
                <p className="text-xs text-muted">
                  {formatDateHuman(o.date)}
                  {o.hasProof && " · ada bukti bayar"}
                </p>
              </div>
              <span className="shrink-0 tabular-nums">{o.billAmount != null ? formatRupiah(o.billAmount) : "—"}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <a href={customer.waUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1">
          Tagih via WA
        </a>
        {confirming ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await markCustomerAllPaid(customer.id);
                setConfirming(false);
              })
            }
            className="btn-primary flex-1"
          >
            {isPending ? "..." : "Ya, lunas semua"}
          </button>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="btn-secondary flex-1">
            Lunasi semua
          </button>
        )}
      </div>
      {confirming && !isPending && (
        <button type="button" onClick={() => setConfirming(false)} className="btn-ghost self-start px-0 text-sm">
          Batal
        </button>
      )}
    </div>
  );
}

export default function ArrearsDashboard({ data }: { data: ArrearsSummary }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-2">
        <div className="card flex flex-col gap-1 p-3">
          <span className="text-xs text-muted">Total nunggak</span>
          <span className="font-display text-base font-bold tabular-nums text-danger">{formatRupiah(data.totalUnpaid)}</span>
        </div>
        <div className="card flex flex-col gap-1 p-3">
          <span className="text-xs text-muted">Pelanggan</span>
          <span className="font-display text-base font-bold tabular-nums">{data.customers.length}</span>
        </div>
        <div className="card flex flex-col gap-1 p-3">
          <span className="text-xs text-muted">Terblokir</span>
          <span className="font-display text-base font-bold tabular-nums">{data.blockedCount}</span>
        </div>
      </div>

      <LimitSetting initial={data.maxUnpaid} />

      <section className="flex flex-col gap-3">
        <h2 className="section-title">
          Daftar penunggak ({data.customers.length})
        </h2>
        {data.customers.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-2xl">🎉</span>
            <p className="text-sm text-muted">Semua pesanan sudah lunas.</p>
          </div>
        ) : (
          data.customers.map((c) => <CustomerRow key={c.id} customer={c} />)
        )}
      </section>
    </div>
  );
}
