"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeWaNumber, isValidWaNumber } from "@/lib/phone";

const submitOrderSchema = z.object({
  sessionId: z.string().min(1),
  name: z.string().trim().min(1, "Nama wajib diisi").max(50),
  waNumber: z
    .string()
    .trim()
    .min(1, "Nomor WA wajib diisi")
    .transform(normalizeWaNumber)
    .refine(isValidWaNumber, "Nomor WA tidak valid"),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1).optional(),
        customText: z.string().trim().min(1).max(100).optional(),
        qty: z.number().int().min(1).max(20),
        note: z.string().trim().max(100).optional(),
      })
    )
    .min(1, "Pilih/isi minimal 1 item"),
});

export type SubmitOrderInput = z.input<typeof submitOrderSchema>;

export async function submitOrder(
  input: SubmitOrderInput
): Promise<{ nomorUrut: number } | { error: string }> {
  const parsed = submitOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const { sessionId, name, waNumber, items } = parsed.data;

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.status !== "PUBLISHED") {
    return { error: "Pemesanan sesi ini sudah ditutup." };
  }

  if (session.mode === "MENU") {
    if (items.some((i) => !i.menuItemId)) {
      return { error: "Data item tidak valid." };
    }
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map((i) => i.menuItemId!) }, sessionId },
    });
    const unavailable = items.find((i) => {
      const menuItem = menuItems.find((m) => m.id === i.menuItemId);
      return !menuItem || menuItem.status !== "AVAILABLE";
    });
    if (unavailable) {
      return { error: "Ada menu yang sudah habis/tidak tersedia. Refresh halaman dulu." };
    }
  } else {
    if (items.some((i) => !i.customText)) {
      return { error: "Isi semua item pesanan." };
    }
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { waNumber },
        update: { name },
        create: { waNumber, name },
      });

      const last = await tx.order.findFirst({
        where: { sessionId },
        orderBy: { nomorUrut: "desc" },
      });
      const nomorUrut = (last?.nomorUrut ?? 0) + 1;
      return tx.order.create({
        data: {
          sessionId,
          customerId: customer.id,
          nomorUrut,
          name,
          items: {
            create: items.map((i) =>
              session.mode === "MENU"
                ? { menuItemId: i.menuItemId!, qty: i.qty, note: i.note || null }
                : { customText: i.customText!, qty: i.qty, note: i.note || null }
            ),
          },
        },
      });
    });

    revalidatePath("/admin");
    revalidatePath(`/admin/sesi/${sessionId}`);
    return { nomorUrut: order.nomorUrut };
  } catch {
    return { error: "Gagal menyimpan pesanan, coba lagi." };
  }
}
