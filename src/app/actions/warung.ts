"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import { normalizeWaNumber, isValidWaNumber } from "@/lib/phone";

type Result = { ok: true } | { error: string };
const UNAUTHORIZED = { error: "Tidak diizinkan." } as const;

function parseWa(input: string | undefined): string | null | "invalid" {
  const trimmed = input?.trim();
  if (!trimmed) return null;
  const n = normalizeWaNumber(trimmed);
  return isValidWaNumber(n) ? n : "invalid";
}

export type WarungListRow = { id: string; name: string; waNumber: string | null; itemCount: number };

export async function listWarungs(): Promise<WarungListRow[]> {
  const rows = await prisma.warung.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });
  return rows.map((w) => ({ id: w.id, name: w.name, waNumber: w.waNumber, itemCount: w._count.items }));
}

export async function getWarung(id: string) {
  return prisma.warung.findUnique({
    where: { id },
    include: { items: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
  });
}

export type WarungForSessionForm = {
  id: string;
  name: string;
  waNumber: string | null;
  items: { id: string; name: string; defaultChecked: boolean }[];
};

/** Data untuk form buat sesi. Centang default mengikuti menu sesi terakhir di warung itu. */
export async function listWarungsForSessionForm(): Promise<WarungForSessionForm[]> {
  const warungs = await prisma.warung.findMany({
    orderBy: { name: "asc" },
    include: { items: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
  });
  // Satu query untuk semua warung (bukan satu per warung) supaya hemat koneksi.
  const sessions = await prisma.session.findMany({
    where: { warungId: { in: warungs.map((w) => w.id) }, mode: "MENU" },
    orderBy: { createdAt: "desc" },
    select: { warungId: true, createdAt: true, menuItems: { select: { name: true } } },
  });
  const lastByWarung = new Map<string, (typeof sessions)[number]>();
  for (const sess of sessions) {
    if (sess.warungId && !lastByWarung.has(sess.warungId)) lastByWarung.set(sess.warungId, sess);
  }

  const result: WarungForSessionForm[] = warungs.map((w) => {
    const last = lastByWarung.get(w.id);
    const lastNames = last && last.menuItems.length > 0 ? new Set(last.menuItems.map((m) => m.name.trim().toLowerCase())) : null;
    return {
      id: w.id,
      name: w.name,
      waNumber: w.waNumber,
      items: w.items.map((i) => ({
        id: i.id,
        name: i.name,
        // Ikut sesi terakhir; lauk yang ditambahkan setelah sesi itu otomatis tercentang supaya tidak terlewat.
        defaultChecked:
          !last || !lastNames ? true : lastNames.has(i.name.trim().toLowerCase()) || i.createdAt > last.createdAt,
      })),
    };
  });
  return result;
}

export async function createWarung(input: { name: string; waNumber?: string; note?: string }) {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;
  const name = input.name.trim();
  if (!name) return { error: "Nama warung wajib diisi." };
  const wa = parseWa(input.waNumber);
  if (wa === "invalid") return { error: "Nomor WA tidak valid." };
  const warung = await prisma.warung.create({
    data: { name, waNumber: wa, note: input.note?.trim() || null },
  });
  revalidatePath("/admin/warung");
  redirect(`/admin/warung/${warung.id}`);
}

export async function updateWarung(
  id: string,
  input: { name: string; waNumber?: string; note?: string }
): Promise<Result> {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;
  const name = input.name.trim();
  if (!name) return { error: "Nama warung wajib diisi." };
  const wa = parseWa(input.waNumber);
  if (wa === "invalid") return { error: "Nomor WA tidak valid." };
  await prisma.warung.update({ where: { id }, data: { name, waNumber: wa, note: input.note?.trim() || null } });
  revalidatePath("/admin/warung");
  revalidatePath(`/admin/warung/${id}`);
  return { ok: true };
}

export async function deleteWarung(id: string) {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;
  // Sesi lama tetap utuh: warungId jadi null (SetNull), menu sesi adalah snapshot.
  await prisma.warung.delete({ where: { id } });
  revalidatePath("/admin/warung");
  redirect("/admin/warung");
}

export async function addWarungItems(
  warungId: string,
  items: { name: string }[]
): Promise<Result> {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;
  const existing = await prisma.warungMenuItem.findMany({ where: { warungId } });
  const seen = new Set(existing.map((i) => i.name.trim().toLowerCase()));
  const data: { warungId: string; name: string; sortOrder: number }[] = [];
  for (const item of items) {
    const name = item.name.trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    data.push({ warungId, name, sortOrder: existing.length + data.length });
  }
  if (data.length === 0) return { error: "Tidak ada lauk baru (kosong atau sudah ada)." };
  await prisma.warungMenuItem.createMany({ data });
  revalidatePath(`/admin/warung/${warungId}`);
  revalidatePath("/admin/warung");
  return { ok: true };
}

export async function updateWarungItem(
  itemId: string,
  input: { name: string }
): Promise<Result> {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;
  const name = input.name.trim();
  if (!name) return { error: "Nama lauk wajib diisi." };
  const item = await prisma.warungMenuItem.update({ where: { id: itemId }, data: { name } });
  revalidatePath(`/admin/warung/${item.warungId}`);
  return { ok: true };
}

export async function deleteWarungItem(itemId: string): Promise<Result> {
  if (!(await isAdminAuthenticated())) return UNAUTHORIZED;
  const item = await prisma.warungMenuItem.delete({ where: { id: itemId } });
  revalidatePath(`/admin/warung/${item.warungId}`);
  revalidatePath("/admin/warung");
  return { ok: true };
}
