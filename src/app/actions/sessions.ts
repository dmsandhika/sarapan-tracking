"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { todayJakarta } from "@/lib/date";
import { generatePublicCode } from "@/lib/publicCode";
import { normalizeWaNumber, isValidWaNumber } from "@/lib/phone";
import type { SessionWithRelations } from "@/app/admin/types";

async function createUniquePublicCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generatePublicCode();
    const existing = await prisma.session.findUnique({ where: { publicCode: code } });
    if (!existing) return code;
  }
  throw new Error("Gagal membuat kode unik, coba lagi.");
}

export async function createSession(input: {
  title: string;
  mode: "MENU" | "FREETEXT";
  vendorWaNumber?: string;
}) {
  const title = input.title.trim();
  if (title.length === 0) {
    throw new Error("Judul sesi wajib diisi.");
  }

  const vendorWaNumber = input.vendorWaNumber?.trim()
    ? normalizeWaNumber(input.vendorWaNumber)
    : null;
  if (vendorWaNumber && !isValidWaNumber(vendorWaNumber)) {
    throw new Error("Nomor WA vendor tidak valid.");
  }

  const publicCode = await createUniquePublicCode();

  const session = await prisma.session.create({
    data: {
      publicCode,
      title,
      date: todayJakarta(),
      mode: input.mode,
      status: input.mode === "FREETEXT" ? "PUBLISHED" : "DRAFT",
      vendorWaNumber,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/pesan");
  redirect(`/admin/sesi/${session.id}`);
}

export async function listActiveSessions() {
  return prisma.session.findMany({
    where: { status: { not: "CLOSED" } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });
}

export async function listPublicActiveSessions() {
  return prisma.session.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    select: { publicCode: true, title: true, mode: true, date: true },
  });
}

export async function getSessionWithRelations(sessionId: string): Promise<SessionWithRelations | null> {
  return prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      menuItems: { orderBy: { sortOrder: "asc" } },
      orders: {
        orderBy: { nomorUrut: "asc" },
        include: {
          items: { include: { menuItem: true, originalMenuItem: true } },
        },
      },
    },
  });
}

export async function closeSessionOrdering(sessionId: string) {
  await prisma.session.update({ where: { id: sessionId }, data: { status: "CLOSED" } });
  revalidatePath("/admin");
  revalidatePath(`/admin/sesi/${sessionId}`);
  revalidatePath("/pesan");
}

export async function reopenSessionOrdering(sessionId: string) {
  await prisma.session.update({ where: { id: sessionId }, data: { status: "PUBLISHED" } });
  revalidatePath("/admin");
  revalidatePath(`/admin/sesi/${sessionId}`);
  revalidatePath("/pesan");
}

export async function updateSessionVendorNumber(
  sessionId: string,
  waNumberInput: string
): Promise<{ error?: string }> {
  const waNumber = normalizeWaNumber(waNumberInput);
  if (!isValidWaNumber(waNumber)) {
    return { error: "Nomor WA tidak valid." };
  }
  await prisma.session.update({ where: { id: sessionId }, data: { vendorWaNumber: waNumber } });
  revalidatePath("/admin");
  revalidatePath(`/admin/sesi/${sessionId}`);
  return {};
}

export async function deleteSession(sessionId: string): Promise<{ error?: string }> {
  const orderCount = await prisma.order.count({ where: { sessionId } });
  if (orderCount > 0) {
    return { error: "Sesi ini sudah ada pesanan masuk, tidak bisa dihapus." };
  }
  await prisma.session.delete({ where: { id: sessionId } });
  revalidatePath("/admin");
  revalidatePath("/pesan");
  redirect("/admin");
}
