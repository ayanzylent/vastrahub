/** Fixed color filter palette. Labels match product tags case-insensitively. */
export const COLOR_FILTER_OPTIONS = [
  { label: "Red", hex: "#DC2626" },
  { label: "Pink", hex: "#EC4899" },
  { label: "Orange", hex: "#EA580C" },
  { label: "Yellow", hex: "#EAB308" },
  { label: "Green", hex: "#16A34A" },
  { label: "Blue", hex: "#2563EB" },
  { label: "Purple", hex: "#9333EA" },
  { label: "Brown", hex: "#92400E" },
  { label: "Black", hex: "#171717" },
  { label: "White", hex: "#F5F5F5" },
  { label: "Grey", hex: "#737373" },
  { label: "Gold", hex: "#CA8A04" },
  { label: "Silver", hex: "#A3A3A3" },
  { label: "Multicolor", hex: "multicolor" },
] as const;

export type ColorFilterLabel = (typeof COLOR_FILTER_OPTIONS)[number]["label"];

const COLOR_LABEL_BY_LOWER = new Map<string, ColorFilterLabel>(
  COLOR_FILTER_OPTIONS.map((c) => [c.label.toLowerCase(), c.label]),
);

/** Map a free-form tag to a palette label when it matches (case-insensitive). */
export function canonicalColorTag(raw: string): ColorFilterLabel | null {
  const key = raw.trim().toLowerCase();
  return key ? (COLOR_LABEL_BY_LOWER.get(key) ?? null) : null;
}

/** Parse `colors` or `tags` query param into known palette labels only. */
export function parseColorFilterParam(raw: string | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(",")) {
    const label = canonicalColorTag(part);
    if (label && !seen.has(label)) {
      seen.add(label);
      result.push(label);
    }
  }
  return result;
}
