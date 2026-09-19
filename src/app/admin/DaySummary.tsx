import { formatRupiah } from "@/lib/currency";
import type { OrderWithItems } from "./types";

export default function DaySummary({ orders }: { orders: OrderWithItems[] }) {
  const totalBilled = orders.reduce((sum, o) => sum + (o.billAmount ?? 0), 0);
  const totalCollected = orders.reduce((sum, o) => sum + (o.paid ? o.billAmount ?? 0 : 0), 0);
  const unpaidOrders = orders.filter((o) => !o.paid);

  return (
    <section className="card flex flex-col gap-3">
      <h2 className="section-title">Rekap</h2>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">Total tagihan</span>
        <span className="font-medium tabular-nums">{formatRupiah(totalBilled)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">Sudah terkumpul</span>
        <span className="font-medium tabular-nums text-success">{formatRupiah(totalCollected)}</span>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
        <span>Belum terkumpul</span>
        <span className="tabular-nums text-danger">{formatRupiah(totalBilled - totalCollected)}</span>
      </div>
      {unpaidOrders.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="text-xs text-muted">Belum bayar:</p>
          <ul className="flex flex-col gap-2">
            {unpaidOrders.map((o) => (
              <li key={o.id} className="text-sm">
                <span className="font-medium">
                  #{o.nomorUrut} {o.name}
                </span>
                <span className="text-muted tabular-nums">
                  {o.billAmount != null ? ` — ${formatRupiah(o.billAmount)}` : " (harga belum ada)"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
