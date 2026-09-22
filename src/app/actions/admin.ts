"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { setAdminSession, clearAdminSession } from "@/lib/auth";
import {
  extractMenuFromImages,
  extractBillFromImages,
  isQuotaExhaustedError,
  type ExtractedMenuItem,
  type ExtractedBillEntry,
  type ImageInput,
} from "@/lib/gemini";

function geminiErrorMessage(e: unknown): string {
  if (isQuotaExhaustedError(e)) {
    return "Kuota gratis Gemini API hari ini sudah habis (limit 20x/hari). Coba lagi besok, atau isi menu/harga manual dulu.";
  }
  return "Gagal membaca gambar. Coba lagi.";
}

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: "Password salah." };
  }
  await setAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}

async function filesToImageInputs(formData: FormData, key: string): Promise<ImageInput[]> {
  const files = formData.getAll(key).filter((f): f is File => f instanceof File);
  return Promise.all(
    files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      return {
        base64: Buffer.from(arrayBuffer).toString("base64"),
        mediaType: (file.type || "image/jpeg") as ImageInput["mediaType"],
      };
    })
  );
}

export async function extractMenuImage(
  formData: FormData
): Promise<{ items: ExtractedMenuItem[] } | { error: string }> {
  const images = await filesToImageInputs(formData, "images");
  if (images.length === 0) return { error: "Gambar tidak ditemukan." };

  try {
    const items = await extractMenuFromImages(images);
    if (items.length === 0) {
      return { error: "Tidak ada menu yang terbaca dari gambar. Coba upload ulang atau isi manual." };
    }
    return { items };
  } catch (e) {
    console.error("extractMenuImage failed:", e);
    return { error: geminiErrorMessage(e) };
  }
}

export async function publishMenuSession(sessionId: string, items: ExtractedMenuItem[]) {
  const session = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
  if (session.mode !== "MENU") {
    throw new Error("Sesi ini bukan mode menu.");
  }

  await prisma.menuItem.createMany({
    data: items.map((item, index) => ({
      sessionId,
      name: item.name,
      sortOrder: index,
    })),
  });
  await prisma.session.update({ where: { id: sessionId }, data: { status: "PUBLISHED" } });

  revalidatePath("/admin");
  revalidatePath(`/admin/sesi/${sessionId}`);
  revalidatePath("/pesan");
}

export async function addMenuItems(sessionId: string, items: ExtractedMenuItem[]) {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: { menuItems: true },
  });
  if (session.mode !== "MENU") {
    throw new Error("Sesi ini bukan mode menu.");
  }

  const existingNames = new Set(session.menuItems.map((m) => m.name.trim().toLowerCase()));
  const newItems = items.filter((item) => !existingNames.has(item.name.trim().toLowerCase()));
  if (newItems.length === 0) return;

  const startOrder = session.menuItems.length;
  await prisma.menuItem.createMany({
    data: newItems.map((item, index) => ({
      sessionId,
      name: item.name,
      sortOrder: startOrder + index,
    })),
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/sesi/${sessionId}`);
  revalidatePath("/pesan");
}

export async function removeMenuItem(menuItemId: string): Promise<{ error?: string }> {
  const usageCount = await prisma.orderItem.count({
    where: { OR: [{ menuItemId }, { originalMenuItemId: menuItemId }] },
  });
  if (usageCount > 0) {
    return { error: "Menu ini sudah dipesan orang, tidak bisa dihapus. Tandai 'Habis' saja." };
  }
  await prisma.menuItem.delete({ where: { id: menuItemId } });
  revalidatePath("/admin");
  revalidatePath("/pesan");
  return {};
}

export async function toggleMenuItemStatus(menuItemId: string, replacementMenuItemId?: string) {
  const item = await prisma.menuItem.findUniqueOrThrow({ where: { id: menuItemId } });
  const nextStatus = item.status === "AVAILABLE" ? "HABIS" : "AVAILABLE";

  await prisma.$transaction(async (tx) => {
    await tx.menuItem.update({ where: { id: menuItemId }, data: { status: nextStatus } });

    if (nextStatus === "HABIS" && replacementMenuItemId) {
      const affected = await tx.orderItem.findMany({ where: { menuItemId } });
      for (const orderItem of affected) {
        await tx.orderItem.update({
          where: { id: orderItem.id },
          data: {
            originalMenuItemId: orderItem.originalMenuItemId ?? orderItem.menuItemId,
            menuItemId: replacementMenuItemId,
          },
        });
      }
    }
  });

  revalidatePath("/admin");
  revalidatePath("/pesan");
}

export async function renameMenuItem(menuItemId: string, name: string): Promise<{ error?: string }> {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { error: "Nama tidak boleh kosong." };
  }
  await prisma.menuItem.update({ where: { id: menuItemId }, data: { name: trimmed } });
  revalidatePath("/admin");
  revalidatePath("/pesan");
  return {};
}

export async function substituteOrderItem(orderItemId: string, newMenuItemId: string) {
  const current = await prisma.orderItem.findUniqueOrThrow({ where: { id: orderItemId } });
  if (current.menuItemId === null) {
    throw new Error("Item pesanan free-text tidak bisa disubstitusi.");
  }
  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      originalMenuItemId: current.originalMenuItemId ?? current.menuItemId,
      menuItemId: newMenuItemId,
    },
  });
  revalidatePath("/admin");
}

export async function toggleOrderPaid(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  await prisma.order.update({ where: { id: orderId }, data: { paid: !order.paid } });
  revalidatePath("/admin");
}

export async function setOrderBillAmount(orderId: string, amount: number | null) {
  await prisma.order.update({ where: { id: orderId }, data: { billAmount: amount } });
  revalidatePath("/admin");
}

export async function deleteOrder(orderId: string) {
  await prisma.order.delete({ where: { id: orderId } });
  revalidatePath("/admin");
}

export async function extractBillImage(
  formData: FormData
): Promise<{ entries: ExtractedBillEntry[] } | { error: string }> {
  const images = await filesToImageInputs(formData, "images");
  if (images.length === 0) return { error: "Gambar tidak ditemukan." };

  try {
    const entries = await extractBillFromImages(images);
    if (entries.length === 0) {
      return { error: "Tidak ada baris bill yang terbaca. Coba upload ulang atau isi manual." };
    }
    return { entries };
  } catch (e) {
    console.error("extractBillImage failed:", e);
    return { error: geminiErrorMessage(e) };
  }
}

export type ApplyBillResult = {
  updated: number;
  unmatched: ExtractedBillEntry[];
  stillMissing: number[];
};

export async function applyBillEntries(
  sessionId: string,
  entries: ExtractedBillEntry[]
): Promise<ApplyBillResult> {
  const orders = await prisma.order.findMany({ where: { sessionId } });
  const orderByNomor = new Map(orders.map((o) => [o.nomorUrut, o]));

  const unmatched: ExtractedBillEntry[] = [];
  let updated = 0;

  for (const entry of entries) {
    const order = orderByNomor.get(entry.nomorUrut);
    if (!order) {
      unmatched.push(entry);
      continue;
    }
    await prisma.order.update({
      where: { id: order.id },
      data: { billAmount: entry.amount },
    });
    orderByNomor.set(entry.nomorUrut, { ...order, billAmount: entry.amount });
    updated++;
  }

  const stillMissing = Array.from(orderByNomor.values())
    .filter((o) => o.billAmount === null)
    .map((o) => o.nomorUrut)
    .sort((a, b) => a - b);

  revalidatePath("/admin");
  return { updated, unmatched, stillMissing };
}
