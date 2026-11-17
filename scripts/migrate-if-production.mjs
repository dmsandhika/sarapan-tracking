// Jalankan `prisma migrate deploy` hanya saat build produksi di Vercel.
// Preview deploy dilewati supaya tidak mengubah database produksi.
import { execSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log(`[migrate] VERCEL_ENV=${process.env.VERCEL_ENV ?? "(tidak diset)"} → lewati migrasi.`);
  process.exit(0);
}

console.log("[migrate] build produksi → prisma migrate deploy");
execSync("npx prisma migrate deploy", { stdio: "inherit" });
