import { createScheduler, createWorker } from "tesseract.js";
import type Tesseract from "tesseract.js";
import sharp from "sharp";

const MIN_PLAUSIBLE_AMOUNT = 500;
const MAX_PLAUSIBLE_AMOUNT = 50_000_000;
const RAW_TEXT_PREVIEW_LENGTH = 200;

const globalForOcr = globalThis as unknown as { ocrScheduler?: Promise<Tesseract.Scheduler> };

async function initScheduler(): Promise<Tesseract.Scheduler> {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL belum diset di .env, gak bisa load Tesseract language data.");
  }
  const scheduler = createScheduler();
  const worker = await createWorker(["eng", "ind"], 1, {
    langPath: `${supabaseUrl}/storage/v1/object/public/tessdata`,
    cachePath: "/tmp",
    gzip: true,
  });
  scheduler.addWorker(worker);
  return scheduler;
}

// Lazy on purpose: this module is imported at the top of admin.ts, which is
// imported by nearly every /admin action — most of which have nothing to do
// with payment proofs. Starting worker init (an ~19MB traineddata download)
// eagerly at import time would slow down every unrelated admin cold start,
// and a rejection before anyone actually calls analyzePaymentProof would be
// a genuinely unhandled promise rejection. Getting it lazily, only on first
// real OCR call, avoids both. On failure the cached promise is cleared so
// the next call gets a fresh retry instead of failing forever for the rest
// of this instance's lifetime.
function getScheduler(): Promise<Tesseract.Scheduler> {
  if (!globalForOcr.ocrScheduler) {
    globalForOcr.ocrScheduler = initScheduler().catch((e) => {
      globalForOcr.ocrScheduler = undefined;
      throw e;
    });
  }
  return globalForOcr.ocrScheduler;
}

type ProviderRule = {
  name: string;
  detect: RegExp;
  amountRegex: RegExp;
  parseAmount: (raw: string) => number;
};

// Each provider has its OWN number format: BCA shows "IDR 13,000.00" (US-style,
// comma=thousands, period=decimal); QRIS/Shopee/DANA show Indonesian-style
// "13.000" (period=thousands, no decimals) — a shared parser would misparse one
// style or the other, so parsing is deliberately per-provider, not generic.
const PROVIDER_RULES: ProviderRule[] = [
  {
    name: "BCA",
    detect: /transfer\s*berhasil/i,
    amountRegex: /idr\s*(\d{1,3}(?:,\d{3})*\.\d{2})/i,
    parseAmount: (raw) => parseInt(raw.split(".")[0].replace(/,/g, ""), 10),
  },
  {
    name: "QRIS",
    detect: /pembayaran\s*qris\s*berhasil/i,
    amountRegex: /sebesar\s*(\d{1,3}(?:\.\d{3})*)\s*telah\s*berhasil/i,
    parseAmount: (raw) => parseInt(raw.replace(/\./g, ""), 10),
  },
  {
    name: "Shopee",
    detect: /rincian\s*pembayaran/i,
    // The leading "+" before "Rp" is unreliable under OCR (often misread as
    // ":"/"-"), and disambiguation is already handled by `detect` above, so
    // it's deliberately not required here.
    amountRegex: /rp\s*(\d{1,3}(?:\.\d{3})*)/i,
    parseAmount: (raw) => parseInt(raw.replace(/\./g, ""), 10),
  },
  {
    name: "DANA",
    detect: /transaction\s*success/i,
    amountRegex: /total\s*payment\s*rp\s*(\d{1,3}(?:\.\d{3})*)/i,
    parseAmount: (raw) => parseInt(raw.replace(/\./g, ""), 10),
  },
];

export type PaymentProofOcrResult =
  | { status: "no-proof" }
  | { status: "engine-error" }
  | { status: "unrecognized"; rawTextPreview: string }
  | { status: "ambiguous"; matchedProviders: string[]; rawTextPreview: string }
  | { status: "amount-unreadable"; provider: string; rawTextPreview: string }
  | { status: "read"; provider: string; ocrAmount: number };

function preview(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, RAW_TEXT_PREVIEW_LENGTH);
}

export async function analyzePaymentProof(buffer: Buffer): Promise<PaymentProofOcrResult> {
  try {
    const preprocessed = await sharp(buffer)
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .grayscale()
      .toBuffer();

    const scheduler = await getScheduler();
    const {
      data: { text: rawText },
    } = await scheduler.addJob("recognize", preprocessed);
    const text = rawText.toLowerCase();
    const rawTextPreview = preview(rawText);

    const matched = PROVIDER_RULES.filter((rule) => rule.detect.test(text));
    if (matched.length === 0) return { status: "unrecognized", rawTextPreview };
    if (matched.length > 1) {
      return { status: "ambiguous", matchedProviders: matched.map((r) => r.name), rawTextPreview };
    }

    const rule = matched[0];
    const amountMatch = text.match(rule.amountRegex);
    if (!amountMatch) return { status: "amount-unreadable", provider: rule.name, rawTextPreview };

    const amount = rule.parseAmount(amountMatch[1]);
    if (!Number.isFinite(amount) || amount < MIN_PLAUSIBLE_AMOUNT || amount > MAX_PLAUSIBLE_AMOUNT) {
      return { status: "amount-unreadable", provider: rule.name, rawTextPreview };
    }

    return { status: "read", provider: rule.name, ocrAmount: amount };
  } catch (e) {
    console.error("analyzePaymentProof failed:", e);
    return { status: "engine-error" };
  }
}
