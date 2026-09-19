import { GoogleGenAI, Type } from "@google/genai";

export type ExtractedMenuItem = {
  name: string;
};

export type ExtractedBillEntry = {
  nomorUrut: number;
  amount: number;
};

export type ImageInput = {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
};

let _ai: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _ai;
}

const MODEL = "gemini-3.6-flash";

export function isQuotaExhaustedError(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  if (status !== 429) return false;
  const message = (error as { message?: string })?.message ?? "";
  return message.includes("RESOURCE_EXHAUSTED") || message.includes("PerDay");
}

function isRetryableStatus(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  if (status === 429) return !isQuotaExhaustedError(error);
  return status === 503;
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableStatus(error) || i === attempts - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

function toImageParts(images: ImageInput[]) {
  return images.map((img) => ({
    inlineData: { mimeType: img.mediaType, data: img.base64 },
  }));
}

const MENU_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nama menu/lauk" },
        },
        required: ["name"],
      },
    },
  },
  required: ["items"],
};

export async function extractMenuFromImages(images: ImageInput[]): Promise<ExtractedMenuItem[]> {
  const response = await withRetry(() =>
    getAi().models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            ...toImageParts(images),
            {
              text:
                "Ini screenshot story WhatsApp menu sarapan dari warung (bisa lebih dari satu gambar, gabungkan jadi satu daftar). Gambar ini TIDAK ada harganya, cukup baca nama menu/lauknya saja. Abaikan teks yang bukan nama menu (jam buka, ongkir, dsb). Kalau ada nama yang sama persis di beberapa gambar, jangan diduplikasi. Balas sesuai schema JSON yang diminta.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: MENU_SCHEMA,
      },
    })
  );

  try {
    const parsed = JSON.parse(response.text ?? "{}") as { items?: ExtractedMenuItem[] };
    return parsed.items ?? [];
  } catch {
    return [];
  }
}

const BILL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    entries: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nomorUrut: { type: Type.NUMBER, description: "Nomor urut pesanan" },
          amount: { type: Type.NUMBER, description: "Harga/total dalam Rupiah untuk nomor urut itu" },
        },
        required: ["nomorUrut", "amount"],
      },
    },
  },
  required: ["entries"],
};

export async function extractBillFromImages(images: ImageInput[]): Promise<ExtractedBillEntry[]> {
  const response = await withRetry(() =>
    getAi().models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            ...toImageParts(images),
            {
              text:
                "Ini foto bill/tagihan dari warung berisi daftar nomor urut pesanan beserta harganya (bisa lebih dari satu gambar, gabungkan jadi satu daftar, boleh tulisan tangan). Baca setiap baris sebagai pasangan nomor urut + harga. Harga dalam angka Rupiah tanpa titik/koma pemisah ribuan (misal 15000, bukan 15.000). PENTING: warung sering nulis harga disingkat tanpa tiga nol di belakang (misal '17' artinya Rp17.000, '13' artinya Rp13.000) — kalau angka yang tertulis kurang dari 1000 (1-2 digit), itu singkatan ribuan, kalikan 1000 jadi harga sebenarnya. Kalau ada baris yang dicoret, digaris, atau ditandai batal, jangan dimasukkan ke hasil. Balas sesuai schema JSON yang diminta.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: BILL_SCHEMA,
      },
    })
  );

  try {
    const parsed = JSON.parse(response.text ?? "{}") as { entries?: ExtractedBillEntry[] };
    return parsed.entries ?? [];
  } catch {
    return [];
  }
}
