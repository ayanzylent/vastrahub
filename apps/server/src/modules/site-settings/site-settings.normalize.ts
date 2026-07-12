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
} from '../../constants/index.js';
import type {
  IHeroConfig,
  IHeroSlide,
  IHomepageBlock,
  IAnnouncementBar,
  IProductPageConfig,
  IEstimatedDeliveryConfig,
  ISiteSettings,
  AnnouncementMode,
  AnnouncementTone,
  BlockAlignment,
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
]);

function normalizeHeroSlide(raw: unknown, index: number): IHeroSlide {
  const fallback = DEFAULT_HERO.slides[0];
  const slide = (raw && typeof raw === 'object' ? raw : {}) as Partial<IHeroSlide>;

  return {
    id: typeof slide.id === 'string' && slide.id.trim() ? slide.id : `slide-${index + 1}`,
    enabled: typeof slide.enabled === 'boolean' ? slide.enabled : fallback.enabled,
    heading: typeof slide.heading === 'string' ? slide.heading : fallback.heading,
    subheading: typeof slide.subheading === 'string' ? slide.subheading : undefined,
    badge: typeof slide.badge === 'string' ? slide.badge : undefined,
    image: slide.image && typeof slide.image === 'object' ? slide.image : undefined,
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

  const page = raw as Partial<IProductPageConfig>;
  const delivery: Partial<IEstimatedDeliveryConfig> =
    page.estimatedDelivery && typeof page.estimatedDelivery === 'object'
      ? page.estimatedDelivery
      : {};

  return {
    version: page.version === 1 ? 1 : fallback.version,
    estimatedDelivery: {
      enabled:
        typeof delivery.enabled === 'boolean'
          ? delivery.enabled
          : fallback.estimatedDelivery.enabled,
      minDays:
        typeof delivery.minDays === 'number' && Number.isFinite(delivery.minDays)
          ? delivery.minDays
          : fallback.estimatedDelivery.minDays,
      maxDays:
        typeof delivery.maxDays === 'number' && Number.isFinite(delivery.maxDays)
          ? delivery.maxDays
          : fallback.estimatedDelivery.maxDays,
    },
    sections: Array.isArray(page.sections) ? page.sections : fallback.sections,
  };
}

export function normalizeHomepageBlocks(raw: unknown): IHomepageBlock[] {
  if (!Array.isArray(raw)) return structuredClone(DEFAULT_HOMEPAGE_BLOCKS);

  return raw.filter((block): block is IHomepageBlock => {
    if (!block || typeof block !== 'object') return false;
    const candidate = block as Partial<IHomepageBlock>;
    return (
      typeof candidate.id === 'string' &&
      candidate.id.trim().length > 0 &&
      typeof candidate.type === 'string' &&
      BLOCK_TYPES.has(candidate.type as IHomepageBlock['type'])
    );
  });
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
