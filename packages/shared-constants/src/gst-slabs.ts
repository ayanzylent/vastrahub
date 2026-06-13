export const GST_SLABS = [0, 5, 12, 18, 28] as const;
export type GSTSlab = (typeof GST_SLABS)[number];

export function isValidGSTSlab(value: number | null): boolean {
  if (value === null) return true;
  return (GST_SLABS as readonly number[]).includes(value);
}
