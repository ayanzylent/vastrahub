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
import { ValidationError } from '../../lib/errors.js';

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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

/** Convert every legacy settings shape into the current read contract. */
export function normalizeSiteSettings(raw: unknown): ISiteSettings {
  const source = asRecord(raw);
  const rawHero = asRecord(source.hero);
  const hero: IHeroConfig = Array.isArray(rawHero.slides)
    ? {
        ...structuredClone(DEFAULT_HERO),
        ...rawHero,
        version: 1,
        slides: rawHero.slides.map((slide, index) => ({
          id: `hero-${index + 1}`,
          enabled: true,
          ...asRecord(slide),
        })),
      } as IHeroConfig
    : {
        ...structuredClone(DEFAULT_HERO),
        slides: [{
          id: 'legacy-hero',
          enabled: true,
          ...rawHero,
        } as IHeroConfig['slides'][number]],
      };

  const rawAnnouncement = asRecord(source.announcementBar);
  const announcementBar: IAnnouncementBar = Array.isArray(rawAnnouncement.messages)
    ? {
        ...structuredClone(DEFAULT_ANNOUNCEMENT_BAR),
        ...rawAnnouncement,
        version: 1,
        messages: rawAnnouncement.messages.map(String),
      } as IAnnouncementBar
    : {
        ...structuredClone(DEFAULT_ANNOUNCEMENT_BAR),
        ...rawAnnouncement,
        version: 1,
        mode: 'simple',
        messages: [typeof rawAnnouncement.message === 'string' ? rawAnnouncement.message : ''],
      } as IAnnouncementBar;

  const rawProductPage = asRecord(source.productPage);
  const rawDelivery = asRecord(rawProductPage.estimatedDelivery);
  const productPage: IProductPageConfig = {
    ...structuredClone(DEFAULT_PRODUCT_PAGE),
    ...rawProductPage,
    version: 1,
    estimatedDelivery: {
      ...DEFAULT_PRODUCT_PAGE.estimatedDelivery,
      ...rawDelivery,
    },
    sections: Array.isArray(rawProductPage.sections)
      ? rawProductPage.sections.map((section, index) => ({
          id: `product-info-${index + 1}`,
          version: 1,
          enabled: true,
          ...asRecord(section),
        })) as IProductPageConfig['sections']
      : structuredClone(DEFAULT_PRODUCT_PAGE.sections),
  };

  const homepageBlocks = (Array.isArray(source.homepageBlocks)
    ? source.homepageBlocks
    : DEFAULT_HOMEPAGE_BLOCKS).map((block) => ({
      version: 1,
      ...asRecord(block),
    })) as IHomepageBlock[];

  return {
    ...source,
    schemaVersion: SITE_SETTINGS_SCHEMA_VERSION,
    hero,
    homepageBlocks,
    announcementBar,
    productPage,
  } as ISiteSettings;
}

export function assertValidSettings(settings: ISiteSettings): void {
  const { minDays, maxDays } = settings.productPage.estimatedDelivery;
  if (minDays > maxDays) {
    throw new ValidationError('Estimated delivery minimum days cannot exceed maximum days');
  }
}

// ---------- Singleton read/write ----------

export async function getOrCreateSettings() {
  const existing = await SiteSettings.findOne({ key: 'singleton' }).lean();
  if (existing) return normalizeSiteSettings(existing);

  const created = await SiteSettings.create({
    key: 'singleton',
    schemaVersion: SITE_SETTINGS_SCHEMA_VERSION,
    hero: DEFAULT_HERO,
    homepageBlocks: DEFAULT_HOMEPAGE_BLOCKS,
    announcementBar: DEFAULT_ANNOUNCEMENT_BAR,
    productPage: DEFAULT_PRODUCT_PAGE,
  });
  return normalizeSiteSettings(created.toObject());
}

export type UpdateSettingsInput = Partial<Pick<
  ISiteSettings,
  'schemaVersion' | 'hero' | 'homepageBlocks' | 'announcementBar' | 'productPage'
>>;

export function mergeSiteSettingsPatch(
  current: ISiteSettings,
  input: UpdateSettingsInput,
): ISiteSettings {
  const normalized = normalizeSiteSettings({ ...current, ...input });
  assertValidSettings(normalized);
  return normalized;
}

export async function updateSettings(input: UpdateSettingsInput) {
  const current = await getOrCreateSettings();
  const normalized = mergeSiteSettingsPatch(current, input);
  const set: Record<string, unknown> = { schemaVersion: SITE_SETTINGS_SCHEMA_VERSION };
  for (const field of ['hero', 'homepageBlocks', 'announcementBar', 'productPage'] as const) {
    if (field in input) set[field] = normalized[field];
  }
  const doc = await SiteSettings.findOneAndUpdate(
    { key: 'singleton' },
    { $set: set },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return normalizeSiteSettings(doc);
}

export async function resetSettings() {
  const doc = await SiteSettings.findOneAndUpdate(
    { key: 'singleton' },
    {
      $set: {
        schemaVersion: SITE_SETTINGS_SCHEMA_VERSION,
        hero: DEFAULT_HERO,
        homepageBlocks: DEFAULT_HOMEPAGE_BLOCKS,
        announcementBar: DEFAULT_ANNOUNCEMENT_BAR,
        productPage: DEFAULT_PRODUCT_PAGE,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return normalizeSiteSettings(doc);
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

/**
 * Return storefront-ready settings: only enabled blocks, with showcase blocks
 * hydrated into ordered document lists.
 */
export async function getHydratedStorefrontSettings() {
  const settings = await getOrCreateSettings();
  const blocks = (settings.homepageBlocks ?? []) as IHomepageBlock[];
  const enabled = blocks.filter((b) => b.enabled);

  const hydrated: IHydratedHomepageBlock[] = await Promise.all(
    enabled.map((block) => BLOCK_HYDRATORS[block.type](block)),
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

export async function getProductPageSettings(): Promise<IProductPageConfig> {
  const settings = await getOrCreateSettings();
  return settings.productPage;
}
