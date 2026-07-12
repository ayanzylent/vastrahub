/**
 * Site settings service — singleton get-or-create, full replace, reset,
 * and storefront hydration.
 */

import { SiteSettings, Category, Collection, Product } from '../../db/models/index.js';
import {
  DEFAULT_HERO,
  DEFAULT_HOMEPAGE_BLOCKS,
  DEFAULT_ANNOUNCEMENT_BAR,
  DEFAULT_PRODUCT_PAGE,
  SITE_SETTINGS_SCHEMA_VERSION,
} from '../../constants/index.js';
import type {
  IHeroConfig,
  IHomepageBlock,
  IAnnouncementBar,
  IHydratedHomepageBlock,
  IProductPageConfig,
  ISiteSettings,
  BlockType,
} from '../../types/index.js';
import { hasResponsiveImage } from '../../lib/responsive-image.js';
import { assertValidSettings } from './site-settings.validation.js';

const STOREFRONT_PRODUCT_CONSTRAINTS: Record<string, unknown> = {
  isActive: true,
  publishedAt: { $ne: null },
  deletedAt: null,
};

function orderByIds<T extends { _id: unknown }>(docs: T[], ids: string[]): T[] {
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  return ids.map((id) => byId.get(id)).filter((d): d is T => d !== undefined);
}

function defaultSettingsPayload() {
  return {
    key: 'singleton' as const,
    schemaVersion: SITE_SETTINGS_SCHEMA_VERSION,
    hero: structuredClone(DEFAULT_HERO),
    homepageBlocks: structuredClone(DEFAULT_HOMEPAGE_BLOCKS),
    announcementBar: structuredClone(DEFAULT_ANNOUNCEMENT_BAR),
    productPage: structuredClone(DEFAULT_PRODUCT_PAGE),
  };
}

function toSiteSettings(doc: unknown): ISiteSettings {
  const record = (doc && typeof doc === 'object' ? doc : {}) as Record<string, unknown>;
  return {
    schemaVersion: SITE_SETTINGS_SCHEMA_VERSION,
    hero: (record.hero as IHeroConfig) ?? DEFAULT_HERO,
    homepageBlocks: (record.homepageBlocks as IHomepageBlock[]) ?? DEFAULT_HOMEPAGE_BLOCKS,
    announcementBar: (record.announcementBar as IAnnouncementBar) ?? DEFAULT_ANNOUNCEMENT_BAR,
    productPage: (record.productPage as IProductPageConfig) ?? DEFAULT_PRODUCT_PAGE,
    createdAt: record.createdAt as Date | undefined,
    updatedAt: record.updatedAt as Date | undefined,
  };
}

export async function getOrCreateSettings(): Promise<ISiteSettings> {
  const existing = await SiteSettings.findOne({ key: 'singleton' }).lean();
  if (existing) {
    return toSiteSettings(existing);
  }

  const created = await SiteSettings.create(defaultSettingsPayload());
  return toSiteSettings(created.toObject());
}

export interface UpdateSettingsInput {
  hero: IHeroConfig;
  homepageBlocks: IHomepageBlock[];
  announcementBar: IAnnouncementBar;
  productPage: IProductPageConfig;
}

/** Full replace of every settings section. */
export async function updateSettings(input: UpdateSettingsInput): Promise<ISiteSettings> {
  assertValidSettings(input);

  const doc = await SiteSettings.findOneAndUpdate(
    { key: 'singleton' },
    {
      $set: {
        schemaVersion: SITE_SETTINGS_SCHEMA_VERSION,
        hero: input.hero,
        homepageBlocks: input.homepageBlocks,
        announcementBar: input.announcementBar,
        productPage: input.productPage,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return toSiteSettings(doc);
}

/** Delete the singleton and recreate from the current defaults. */
export async function resetSettings(): Promise<ISiteSettings> {
  await SiteSettings.deleteOne({ key: 'singleton' });
  const created = await SiteSettings.create(defaultSettingsPayload());
  return toSiteSettings(created.toObject());
}

export async function getHero(): Promise<IHeroConfig> {
  const settings = await getOrCreateSettings();
  return settings.hero;
}

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

type BlockHydrator = (block: IHomepageBlock) => Promise<IHydratedHomepageBlock>;

const BLOCK_HYDRATORS = {
  categoryShowcase: async (block) => ({
    ...block,
    resolved: await resolveCategories(
      block.type === 'categoryShowcase' ? block.config.categoryIds ?? [] : [],
    ) as never,
  }),
  collectionShowcase: async (block) => ({
    ...block,
    resolved: await resolveCollections(
      block.type === 'collectionShowcase' ? block.config.collectionIds ?? [] : [],
    ) as never,
  }),
  featuredProducts: async (block) => ({
    ...block,
    resolved: await resolveProducts(
      block.type === 'featuredProducts' ? block.config.productIds ?? [] : [],
    ) as never,
  }),
  videoEmbed: async (block) => block as IHydratedHomepageBlock,
  banner: async (block) => block as IHydratedHomepageBlock,
} satisfies Record<BlockType, BlockHydrator>;

export async function getHydratedStorefrontSettings() {
  const settings = await getOrCreateSettings();
  const enabled = settings.homepageBlocks.filter((b) => {
    if (!b.enabled) return false;
    if (b.type === 'banner') return hasResponsiveImage(b.config?.image);
    return true;
  });

  const hydrated: IHydratedHomepageBlock[] = await Promise.all(
    enabled.map((block) => BLOCK_HYDRATORS[block.type](block)),
  );

  return {
    homepageBlocks: hydrated,
    announcementBar: settings.announcementBar,
  };
}

export async function getAnnouncementBar(): Promise<IAnnouncementBar> {
  const settings = await getOrCreateSettings();
  return settings.announcementBar;
}

export async function getProductPageSettings(): Promise<IProductPageConfig> {
  const settings = await getOrCreateSettings();
  return settings.productPage;
}
