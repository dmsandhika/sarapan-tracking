import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deletePaymentProof } from "@/lib/supabaseStorage";

export const dynamic = "force-dynamic";

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_MS);
  const orders = await prisma.order.findMany({
    where: { paid: true, paidAt: { lte: cutoff }, paymentProofPath: { not: null } },
    select: { id: true, paymentProofPath: true },
  });

  let deleted = 0;
  let failed = 0;
  for (const order of orders) {
    if (!order.paymentProofPath) continue;
    try {
      await deletePaymentProof(order.paymentProofPath);
      await prisma.order.update({ where: { id: order.id }, data: { paymentProofPath: null } });
      deleted++;
    } catch (e) {
      // One bad object shouldn't block cleanup of the rest of this week's
      // batch — it just stays eligible and gets retried next run.
      console.error(`failed to clean up payment proof for order ${order.id}:`, e);
      failed++;
    }
  }

  return NextResponse.json({ deleted, failed });
}
