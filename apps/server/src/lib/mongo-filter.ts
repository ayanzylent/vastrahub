/**
 * Shared MongoDB filter helpers for storefront listing queries.
 */

/** Escape a string for safe use inside a RegExp. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Match any of the given tags case-insensitively (exact whole-string match).
 * Used so color filters like "Red" match stored tags like "red".
 */
export function caseInsensitiveTagsIn(tags: string[]): RegExp[] {
  return tags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => new RegExp(`^${escapeRegExp(t)}$`, 'i'));
}
