/**
 * Site settings service — singleton get-or-create, full-replace update, reset,
 * and storefront hydration.
 *
 * Hydration resolves each showcase block's curated id list into the actual
 * (ordered, visibility-filtered) documents so the storefront renders without
 * extra round-trips. When a block's id list is empty, it falls back to the same
 * "top / featured" queries the previously-hardcoded homepage used — so the page
 * looks identical before an admin curates anything.
 */

import { SiteSettings, Category, Collection, Product } from '../../db/models/index.js';
import {
  DEFAULT_HERO,
  DEFAULT_HOMEPAGE_BLOCKS,
  DEFAULT_ANNOUNCEMENT_BAR,
} from '../../constants/index.js';
import type {
  IHeroConfig,
  IHomepageBlock,
  IAnnouncementBar,
  IHydratedHomepageBlock,
} from '../../types/index.js';

// ---------- Constants ----------

/** Products a storefront customer is allowed to see. */
const STOREFRONT_PRODUCT_CONSTRAINTS: Record<string, unknown> = {
  isActive: true,
  publishedAt: { $ne: null },
  deletedAt: null,
};

// ---------- Helpers ----------

/** Re-map fetched docs into the curated id order, dropping ids with no doc. */
function orderByIds<T extends { _id: unknown }>(docs: T[], ids: string[]): T[] {
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  return ids.map((id) => byId.get(id)).filter((d): d is T => d !== undefined);
}

// ---------- Singleton read/write ----------

export async function getOrCreateSettings() {
  const existing = await SiteSettings.findOne({ key: 'singleton' }).lean();
  if (existing) return existing;

  const created = await SiteSettings.create({
    key: 'singleton',
    hero: DEFAULT_HERO,
    homepageBlocks: DEFAULT_HOMEPAGE_BLOCKS,
    announcementBar: DEFAULT_ANNOUNCEMENT_BAR,
  });
  return created.toObject();
}

export interface UpdateSettingsInput {
  hero: IHeroConfig;
  homepageBlocks: IHomepageBlock[];
  announcementBar: IAnnouncementBar;
}

export async function updateSettings(input: UpdateSettingsInput) {
  const doc = await SiteSettings.findOneAndUpdate(
    { key: 'singleton' },
    {
      $set: {
        hero: input.hero,
        homepageBlocks: input.homepageBlocks,
        announcementBar: input.announcementBar,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return doc;
}

export async function resetSettings() {
  const doc = await SiteSettings.findOneAndUpdate(
    { key: 'singleton' },
    {
      $set: {
        hero: DEFAULT_HERO,
        homepageBlocks: DEFAULT_HOMEPAGE_BLOCKS,
        announcementBar: DEFAULT_ANNOUNCEMENT_BAR,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return doc;
}

/** Just the singleton hero config — served by its own storefront endpoint (ISR). */
export async function getHero(): Promise<IHeroConfig> {
  const settings = await getOrCreateSettings();
  return (settings.hero ?? DEFAULT_HERO) as IHeroConfig;
}

// ---------- Storefront hydration ----------

// When a showcase block has no manually-curated ids, it falls back to showing
// all `isFeatured` items of that type (curated via each entity's own admin page).

async function resolveCategories(ids: string[]) {
  if (ids.length === 0) {
    return Category.find({ isActive: true, isFeatured: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
  }
  const docs = await Category.find({ _id: { $in: ids }, isActive: true }).lean();
  return orderByIds(docs, ids);
}

async function resolveCollections(ids: string[]) {
  if (ids.length === 0) {
    return Collection.find({ isActive: true, isFeatured: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
  }
  const docs = await Collection.find({ _id: { $in: ids }, isActive: true }).lean();
  return orderByIds(docs, ids);
}

async function resolveProducts(ids: string[]) {
  if (ids.length === 0) {
    return Product.find({ ...STOREFRONT_PRODUCT_CONSTRAINTS, isFeatured: true })
      .sort({ createdAt: -1 })
      .lean();
  }
  const docs = await Product.find({ _id: { $in: ids }, ...STOREFRONT_PRODUCT_CONSTRAINTS }).lean();
  return orderByIds(docs, ids);
}

/**
 * Return storefront-ready settings: only enabled blocks, with showcase blocks
 * hydrated into ordered document lists.
 */
export async function getHydratedStorefrontSettings() {
  const settings = await getOrCreateSettings();
  const blocks = (settings.homepageBlocks ?? []) as IHomepageBlock[];
  const enabled = blocks.filter((b) => b.enabled);

  const hydrated: IHydratedHomepageBlock[] = await Promise.all(
    enabled.map(async (block): Promise<IHydratedHomepageBlock> => {
      switch (block.type) {
        case 'categoryShowcase':
          return { ...block, resolved: (await resolveCategories(block.config.categoryIds ?? [])) as never };
        case 'collectionShowcase':
          return { ...block, resolved: (await resolveCollections(block.config.collectionIds ?? [])) as never };
        case 'featuredProducts':
          return { ...block, resolved: (await resolveProducts(block.config.productIds ?? [])) as never };
        default:
          return block;
      }
    }),
  );

  return {
    homepageBlocks: hydrated,
    announcementBar: (settings.announcementBar ?? DEFAULT_ANNOUNCEMENT_BAR) as IAnnouncementBar,
  };
}

/**
 * Lightweight read of just the announcement bar — used on every storefront page,
 * so it deliberately skips the (heavier) homepage-block hydration.
 */
export async function getAnnouncementBar(): Promise<IAnnouncementBar> {
  const settings = await getOrCreateSettings();
  return (settings.announcementBar ?? DEFAULT_ANNOUNCEMENT_BAR) as IAnnouncementBar;
}
