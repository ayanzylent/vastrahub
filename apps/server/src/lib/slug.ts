/**
 * Slug generation utility.
 * Generates unique slugs with collision detection against both slug and slugHistory.
 */

import slugify from 'slugify';
import type { Model } from 'mongoose';

export interface SlugCheckModel {
  findOne(filter: Record<string, unknown>): { lean(): Promise<unknown> };
}

/**
 * Generate a unique slug from a name.
 * Checks collisions against both `slug` field and `slugHistory.slug` field.
 *
 * @param name - The display name to slugify
 * @param model - The Mongoose model to check for collisions
 * @param existingId - Exclude this document from collision checks (for updates)
 * @returns A unique slug string
 */
export async function generateUniqueSlug(
  name: string,
  model: Model<unknown>,
  existingId?: string,
): Promise<string> {
  const baseSlug = slugify(name, { lower: true, strict: true, trim: true });

  let slug = baseSlug;
  let counter = 1;
  const maxAttempts = 100;

  while (counter <= maxAttempts) {
    const filter: Record<string, unknown> = {
      $or: [
        { slug },
        { 'slugHistory.slug': slug },
      ],
    };

    if (existingId) {
      filter._id = { $ne: existingId };
    }

    const existing = await model.findOne(filter).lean();

    if (!existing) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  // Fallback: append timestamp
  return `${baseSlug}-${Date.now()}`;
}
