export function todayJakarta(): string {
  // YYYY-MM-DD in Asia/Jakarta, independent of server timezone
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatDateHuman(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00+07:00`);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
