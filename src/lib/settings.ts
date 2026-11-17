import { prisma } from "@/lib/prisma";

export const DEFAULT_MAX_UNPAID_ORDERS = 3;
const MAX_UNPAID_KEY = "maxUnpaidOrders";

/** Batas pesanan belum lunas per pelanggan. 0 = tanpa batas. */
export async function getMaxUnpaidOrders(): Promise<number> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: MAX_UNPAID_KEY } });
    const n = row ? Number(row.value) : NaN;
    return Number.isInteger(n) && n >= 0 ? n : DEFAULT_MAX_UNPAID_ORDERS;
  } catch {
    // Tabel belum ada (migrasi belum jalan) → pakai default, jangan blok pemesanan.
    return DEFAULT_MAX_UNPAID_ORDERS;
  }
}

export async function saveMaxUnpaidOrders(value: number) {
  await prisma.appSetting.upsert({
    where: { key: MAX_UNPAID_KEY },
    update: { value: String(value) },
    create: { key: MAX_UNPAID_KEY, value: String(value) },
  });
}
