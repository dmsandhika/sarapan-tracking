"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const submitOrderSchema = z.object({
  dayId: z.string().min(1),
  name: z.string().trim().min(1, "Nama wajib diisi").max(50),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        qty: z.number().int().min(1).max(20),
        note: z.string().trim().max(100).optional(),
      })
    )
    .min(1, "Pilih minimal 1 menu"),
});

export type SubmitOrderInput = z.infer<typeof submitOrderSchema>;

export async function submitOrder(
  input: SubmitOrderInput
): Promise<{ nomorUrut: number } | { error: string }> {
  const parsed = submitOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const { dayId, name, items } = parsed.data;

  const day = await prisma.day.findUnique({ where: { id: dayId } });
  if (!day || day.status !== "PUBLISHED") {
    return { error: "Pemesanan hari ini sudah ditutup." };
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map((i) => i.menuItemId) }, dayId },
  });
  const unavailable = items.find((i) => {
    const menuItem = menuItems.find((m) => m.id === i.menuItemId);
    return !menuItem || menuItem.status !== "AVAILABLE";
  });
  if (unavailable) {
    return { error: "Ada menu yang sudah habis/tidak tersedia. Refresh halaman dulu." };
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const last = await tx.order.findFirst({
        where: { dayId },
        orderBy: { nomorUrut: "desc" },
      });
      const nomorUrut = (last?.nomorUrut ?? 0) + 1;
      return tx.order.create({
        data: {
          dayId,
          nomorUrut,
          name,
          items: {
            create: items.map((i) => ({
              menuItemId: i.menuItemId,
              qty: i.qty,
              note: i.note || null,
            })),
          },
        },
      });
    });

    revalidatePath("/admin");
    return { nomorUrut: order.nomorUrut };
  } catch {
    return { error: "Gagal menyimpan pesanan, coba lagi." };
  }
}
