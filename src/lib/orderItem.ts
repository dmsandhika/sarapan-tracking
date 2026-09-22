export function orderItemLabel(item: { customText: string | null; menuItem: { name: string } | null }): string {
  return item.customText ?? item.menuItem?.name ?? "?";
}
