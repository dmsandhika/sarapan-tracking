import Anthropic from "@anthropic-ai/sdk";

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

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function toImageBlocks(images: ImageInput[]): Anthropic.ImageBlockParam[] {
  return images.map((img) => ({
    type: "image",
    source: { type: "base64", media_type: img.mediaType, data: img.base64 },
  }));
}

const EXTRACT_MENU_TOOL = {
  name: "extract_menu",
  description: "Simpan daftar nama menu sarapan yang terbaca dari gambar (bisa lebih dari 1 gambar).",
  input_schema: {
    type: "object" as const,
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nama menu/lauk" },
          },
          required: ["name"],
        },
      },
    },
    required: ["items"],
  },
};

export async function extractMenuFromImages(images: ImageInput[]): Promise<ExtractedMenuItem[]> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    tools: [EXTRACT_MENU_TOOL],
    tool_choice: { type: "tool", name: "extract_menu" },
    messages: [
      {
        role: "user",
        content: [
          ...toImageBlocks(images),
          {
            type: "text",
            text:
              "Ini screenshot story WhatsApp menu sarapan dari warung (bisa lebih dari satu gambar, gabungkan jadi satu daftar). Gambar ini TIDAK ada harganya, cukup baca nama menu/lauknya saja lalu panggil tool extract_menu. Abaikan teks yang bukan nama menu (jam buka, ongkir, dsb). Kalau ada nama yang sama persis di beberapa gambar, jangan diduplikasi.",
          },
        ],
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) return [];
  const input = toolUse.input as { items?: ExtractedMenuItem[] };
  return input.items ?? [];
}

const EXTRACT_BILL_TOOL = {
  name: "extract_bill",
  description: "Simpan daftar nomor urut pesanan beserta harganya dari foto bill warung.",
  input_schema: {
    type: "object" as const,
    properties: {
      entries: {
        type: "array",
        items: {
          type: "object",
          properties: {
            nomorUrut: { type: "number", description: "Nomor urut pesanan" },
            amount: { type: "number", description: "Harga/total dalam Rupiah untuk nomor urut itu" },
          },
          required: ["nomorUrut", "amount"],
        },
      },
    },
    required: ["entries"],
  },
};

export async function extractBillFromImages(images: ImageInput[]): Promise<ExtractedBillEntry[]> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    tools: [EXTRACT_BILL_TOOL],
    tool_choice: { type: "tool", name: "extract_bill" },
    messages: [
      {
        role: "user",
        content: [
          ...toImageBlocks(images),
          {
            type: "text",
            text:
              "Ini foto bill/tagihan dari warung berisi daftar nomor urut pesanan beserta harganya (bisa lebih dari satu gambar, gabungkan jadi satu daftar). Baca setiap baris sebagai pasangan nomor urut + harga, lalu panggil tool extract_bill. Harga dalam angka Rupiah tanpa titik/koma pemisah ribuan (misal 15000, bukan 15.000).",
          },
        ],
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) return [];
  const input = toolUse.input as { entries?: ExtractedBillEntry[] };
  return input.entries ?? [];
}
