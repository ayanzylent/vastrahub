/**
 * Normalizes raw MongoDB site-settings documents by deep-merging with defaults.
 * Keeps reads safe when legacy or partial documents are missing nested fields.
 */

import {
  DEFAULT_HERO,
  DEFAULT_HOMEPAGE_BLOCKS,
  DEFAULT_ANNOUNCEMENT_BAR,
  DEFAULT_PRODUCT_PAGE,
  SITE_SETTINGS_SCHEMA_VERSION,
  SITE_SETTINGS_LIMITS,
} from '../../constants/index.js';
import type {
  IHeroConfig,
  IHeroSlide,
  IHomepageBlock,
  IAnnouncementBar,
  IProductPageConfig,
  IProductPageBadges,
  IProductInfoBlock,
  IEstimatedDeliveryConfig,
  ISiteSettings,
  AnnouncementMode,
  AnnouncementTone,
  BlockAlignment,
  ShowcaseLayout,
  ICategoryShowcaseConfig,
  ICollectionShowcaseConfig,
  IFeaturedProductsConfig,
  IVideoEmbedConfig,
  IBannerConfig,
  IImageMosaicConfig,
  IImageMosaicItem,
  ILogoMarqueeConfig,
  ILogoMarqueeItem,
  VideoProvider,
} from '../../types/index.js';

const ANNOUNCEMENT_MODES = new Set<AnnouncementMode>(['simple', 'typewriter']);
const ANNOUNCEMENT_TONES = new Set<AnnouncementTone>(['default', 'promo', 'info', 'warning']);
const BLOCK_ALIGNMENTS = new Set<BlockAlignment>(['left', 'center', 'right']);
const BLOCK_TYPES = new Set<IHomepageBlock['type']>([
  'categoryShowcase',
  'collectionShowcase',
  'featuredProducts',
  'videoEmbed',
  'banner',
  'imageMosaic',
  'logoMarquee',
]);

const SHOWCASE_LAYOUTS = new Set<ShowcaseLayout>(['grid', 'carousel']);

const VIDEO_PROVIDERS = new Set<VideoProvider>(['instagram', 'facebook', 'youtube']);

const IMAGE_MOSAIC_SLOT_COUNT = 4;

function normalizeShowcaseLayout(raw: unknown): ShowcaseLayout {
  return SHOWCASE_LAYOUTS.has(raw as ShowcaseLayout) ? (raw as ShowcaseLayout) : 'grid';
}

function normalizeIdArray(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : [];
}

function normalizeOptionalString(raw: unknown): string | undefined {
  return typeof raw === 'string' ? raw : undefined;
}

function normalizeImageMosaicItem(raw: unknown): IImageMosaicItem {
  const item = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    image:
      item.image && typeof item.image === 'object'
        ? (item.image as IImageMosaicItem['image'])
        : undefined,
    title: normalizeOptionalString(item.title),
    badge: normalizeOptionalString(item.badge),
    href: normalizeOptionalString(item.href),
    alt: normalizeOptionalString(item.alt),
  };
}

function normalizeImageMosaicItems(raw: unknown): IImageMosaicItem[] {
  const source = Array.isArray(raw) ? raw : [];
  const items: IImageMosaicItem[] = [];
  for (let i = 0; i < IMAGE_MOSAIC_SLOT_COUNT; i++) {
    items.push(normalizeImageMosaicItem(source[i]));
  }
  return items;
}

function normalizeLogoMarqueeItem(raw: unknown): ILogoMarqueeItem {
  const item = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const imageKey =
    typeof item.imageKey === 'string' && item.imageKey.trim()
      ? item.imageKey.trim()
      : undefined;
  const imageKeyDark =
    typeof item.imageKeyDark === 'string' && item.imageKeyDark.trim()
      ? item.imageKeyDark.trim()
      : undefined;
  return {
    imageKey,
    imageKeyDark,
    href: normalizeOptionalString(item.href),
    alt: normalizeOptionalString(item.alt),
  };
}

function normalizeLogoMarqueeItems(raw: unknown): ILogoMarqueeItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map(normalizeLogoMarqueeItem)
    .slice(0, SITE_SETTINGS_LIMITS.MAX_LOGO_MARQUEE_ITEMS);
}

function normalizeHomepageBlock(block: IHomepageBlock): IHomepageBlock {
  const raw =
    block.config && typeof block.config === 'object'
      ? (block.config as Record<string, unknown>)
      : {};

  switch (block.type) {
    case 'categoryShowcase': {
      const config: ICategoryShowcaseConfig = {
        title: normalizeOptionalString(raw.title),
        subtitle: normalizeOptionalString(raw.subtitle),
        categoryIds: normalizeIdArray(raw.categoryIds),
        layout: normalizeShowcaseLayout(raw.layout),
      };
      return { ...block, config };
    }
    case 'collectionShowcase': {
      const config: ICollectionShowcaseConfig = {
        title: normalizeOptionalString(raw.title),
        subtitle: normalizeOptionalString(raw.subtitle),
        collectionIds: normalizeIdArray(raw.collectionIds),
        layout: normalizeShowcaseLayout(raw.layout),
      };
      return { ...block, config };
    }
    case 'featuredProducts': {
      const config: IFeaturedProductsConfig = {
        title: normalizeOptionalString(raw.title),
        subtitle: normalizeOptionalString(raw.subtitle),
        productIds: normalizeIdArray(raw.productIds),
        layout: normalizeShowcaseLayout(raw.layout),
      };
      return { ...block, config };
    }
    case 'videoEmbed': {
      const videos = Array.isArray(raw.videos)
        ? raw.videos
            .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
            .map((item) => ({
              provider: VIDEO_PROVIDERS.has(item.provider as VideoProvider)
                ? (item.provider as VideoProvider)
                : 'youtube',
              url: typeof item.url === 'string' ? item.url : '',
              caption: normalizeOptionalString(item.caption),
            }))
        : [];
      const config: IVideoEmbedConfig = {
        title: normalizeOptionalString(raw.title),
        subtitle: normalizeOptionalString(raw.subtitle),
        videos,
      };
      return { ...block, config };
    }
    case 'banner': {
      const config: IBannerConfig = {
        image:
          raw.image && typeof raw.image === 'object'
            ? (raw.image as IBannerConfig['image'])
            : undefined,
        href: normalizeOptionalString(raw.href),
        alt: normalizeOptionalString(raw.alt),
      };
      return { ...block, config };
    }
    case 'imageMosaic': {
      const config: IImageMosaicConfig = {
        items: normalizeImageMosaicItems(raw.items),
      };
      return { ...block, config };
    }
    case 'logoMarquee': {
      const config: ILogoMarqueeConfig = {
        title: normalizeOptionalString(raw.title),
        items: normalizeLogoMarqueeItems(raw.items),
      };
      return { ...block, config };
    }
    default:
      return block;
  }
}

function normalizeHeroSlide(raw: unknown, index: number): IHeroSlide {
  const fallback = DEFAULT_HERO.slides[0];
  const slide = (raw && typeof raw === 'object' ? raw : {}) as Partial<IHeroSlide>;

  return {
    id: typeof slide.id === 'string' && slide.id.trim() ? slide.id : `slide-${index + 1}`,
    enabled: typeof slide.enabled === 'boolean' ? slide.enabled : fallback.enabled,
    heading: typeof slide.heading === 'string' && slide.heading.trim() ? slide.heading : undefined,
    subheading: typeof slide.subheading === 'string' ? slide.subheading : undefined,
    badge: typeof slide.badge === 'string' ? slide.badge : undefined,
    image: slide.image && typeof slide.image === 'object' ? slide.image : undefined,
    imageHref: typeof slide.imageHref === 'string' && slide.imageHref.trim()
      ? slide.imageHref.trim()
      : undefined,
    alignment: BLOCK_ALIGNMENTS.has(slide.alignment as BlockAlignment)
      ? (slide.alignment as BlockAlignment)
      : fallback.alignment,
    primaryCta:
      slide.primaryCta &&
      typeof slide.primaryCta === 'object' &&
      typeof slide.primaryCta.label === 'string' &&
      typeof slide.primaryCta.href === 'string'
        ? slide.primaryCta
        : undefined,
    secondaryCta:
      slide.secondaryCta &&
      typeof slide.secondaryCta === 'object' &&
      typeof slide.secondaryCta.label === 'string' &&
      typeof slide.secondaryCta.href === 'string'
        ? slide.secondaryCta
        : undefined,
  };
}

export function normalizeHero(raw: unknown): IHeroConfig {
  const fallback = structuredClone(DEFAULT_HERO);
  if (!raw || typeof raw !== 'object') return fallback;

  const hero = raw as Partial<IHeroConfig>;
  const slides = Array.isArray(hero.slides) && hero.slides.length > 0
    ? hero.slides.map((slide, index) => normalizeHeroSlide(slide, index))
    : fallback.slides;

  return {
    version: hero.version === 1 ? 1 : fallback.version,
    autoplay: typeof hero.autoplay === 'boolean' ? hero.autoplay : fallback.autoplay,
    intervalMs:
      typeof hero.intervalMs === 'number' && Number.isFinite(hero.intervalMs)
        ? hero.intervalMs
        : fallback.intervalMs,
    slides,
  };
}

export function normalizeAnnouncementBar(raw: unknown): IAnnouncementBar {
  const fallback = structuredClone(DEFAULT_ANNOUNCEMENT_BAR);
  if (!raw || typeof raw !== 'object') return fallback;

  const bar = raw as Partial<IAnnouncementBar>;
  const messages = Array.isArray(bar.messages)
    ? bar.messages.filter((message): message is string => typeof message === 'string')
    : fallback.messages;

  return {
    version: bar.version === 1 ? 1 : fallback.version,
    enabled: typeof bar.enabled === 'boolean' ? bar.enabled : fallback.enabled,
    mode: ANNOUNCEMENT_MODES.has(bar.mode as AnnouncementMode)
      ? (bar.mode as AnnouncementMode)
      : fallback.mode,
    messages: messages.length > 0 ? messages : fallback.messages,
    linkText: typeof bar.linkText === 'string' ? bar.linkText : undefined,
    linkHref: typeof bar.linkHref === 'string' ? bar.linkHref : undefined,
    tone: ANNOUNCEMENT_TONES.has(bar.tone as AnnouncementTone)
      ? (bar.tone as AnnouncementTone)
      : fallback.tone,
  };
}

export function normalizeProductPage(raw: unknown): IProductPageConfig {
  const fallback = structuredClone(DEFAULT_PRODUCT_PAGE);
  if (!raw || typeof raw !== 'object') return fallback;

  const page = raw as Record<string, unknown>;
  const deliveryRaw =
    page.estimatedDelivery && typeof page.estimatedDelivery === 'object'
      ? (page.estimatedDelivery as Partial<IEstimatedDeliveryConfig>)
      : {};
  const badgesRaw =
    page.badges && typeof page.badges === 'object'
      ? (page.badges as Partial<IProductPageBadges>)
      : {};

  const normalizeInfoBlock = (value: unknown): IProductInfoBlock => {
    if (!value || typeof value !== 'object') return {};
    const block = value as Partial<IProductInfoBlock>;
    const next: IProductInfoBlock = {};
    if (typeof block.content === 'string' && block.content.trim()) {
      next.content = block.content;
    }
    if (typeof block.linkText === 'string' && block.linkText.trim()) {
      next.linkText = block.linkText;
    }
    if (typeof block.linkHref === 'string' && block.linkHref.trim()) {
      next.linkHref = block.linkHref;
    }
    return next;
  };

  return {
    version: 2,
    estimatedDelivery: {
      enabled:
        typeof deliveryRaw.enabled === 'boolean'
          ? deliveryRaw.enabled
          : fallback.estimatedDelivery.enabled,
      minDays:
        typeof deliveryRaw.minDays === 'number' && Number.isFinite(deliveryRaw.minDays)
          ? deliveryRaw.minDays
          : fallback.estimatedDelivery.minDays,
      maxDays:
        typeof deliveryRaw.maxDays === 'number' && Number.isFinite(deliveryRaw.maxDays)
          ? deliveryRaw.maxDays
          : fallback.estimatedDelivery.maxDays,
    },
    badges: {
      easyReturn:
        typeof badgesRaw.easyReturn === 'boolean'
          ? badgesRaw.easyReturn
          : fallback.badges.easyReturn,
      easyReplacement:
        typeof badgesRaw.easyReplacement === 'boolean'
          ? badgesRaw.easyReplacement
          : fallback.badges.easyReplacement,
      cod: typeof badgesRaw.cod === 'boolean' ? badgesRaw.cod : fallback.badges.cod,
      freeDelivery:
        typeof badgesRaw.freeDelivery === 'boolean'
          ? badgesRaw.freeDelivery
          : fallback.badges.freeDelivery,
      authentic:
        typeof badgesRaw.authentic === 'boolean'
          ? badgesRaw.authentic
          : fallback.badges.authentic,
    },
    returnAndExchange: normalizeInfoBlock(page.returnAndExchange),
    shippingInformation: normalizeInfoBlock(page.shippingInformation),
    sellerInformation: normalizeInfoBlock(page.sellerInformation),
  };
}

export function normalizeHomepageBlocks(raw: unknown): IHomepageBlock[] {
  if (!Array.isArray(raw)) return structuredClone(DEFAULT_HOMEPAGE_BLOCKS);

  return raw
    .filter((block): block is IHomepageBlock => {
      if (!block || typeof block !== 'object') return false;
      const candidate = block as Partial<IHomepageBlock>;
      return (
        typeof candidate.id === 'string' &&
        candidate.id.trim().length > 0 &&
        typeof candidate.type === 'string' &&
        BLOCK_TYPES.has(candidate.type as IHomepageBlock['type'])
      );
    })
    .map(normalizeHomepageBlock);
}

export function toSiteSettings(doc: unknown): ISiteSettings {
  const record = (doc && typeof doc === 'object' ? doc : {}) as Record<string, unknown>;
  return {
    schemaVersion: SITE_SETTINGS_SCHEMA_VERSION,
    hero: normalizeHero(record.hero),
    homepageBlocks: normalizeHomepageBlocks(record.homepageBlocks),
    announcementBar: normalizeAnnouncementBar(record.announcementBar),
    productPage: normalizeProductPage(record.productPage),
    createdAt: record.createdAt as Date | undefined,
    updatedAt: record.updatedAt as Date | undefined,
  };
}
