import { createClient } from "@supabase/supabase-js";

const BUCKET = "payment-proofs";
const SIGNED_URL_TTL_SECONDS = 60 * 10;

function getClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY belum diset di .env.");
  }
  return createClient(url, serviceRoleKey);
}

export async function uploadPaymentProof(
  orderId: string,
  buffer: Buffer,
  contentType: string,
  ext: string
): Promise<string> {
  const path = `${orderId}-${Date.now()}.${ext}`;
  const { error } = await getClient()
    .storage.from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) throw new Error(error.message);
  return path;
}

export async function getSignedPaymentProofUrl(path: string): Promise<string | null> {
  const { data, error } = await getClient()
    .storage.from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) return null;
  return data.signedUrl;
}

export async function deletePaymentProof(path: string): Promise<void> {
  const { error } = await getClient().storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
