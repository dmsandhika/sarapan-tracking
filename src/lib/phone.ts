export function normalizeWaNumber(input: string): string {
  const trimmed = input.trim().replace(/[^\d+]/g, "");
  if (trimmed.startsWith("0")) return `62${trimmed.slice(1)}`;
  if (trimmed.startsWith("+")) return trimmed.slice(1);
  return trimmed;
}

export function isValidWaNumber(normalized: string): boolean {
  return /^\d{9,15}$/.test(normalized);
}
