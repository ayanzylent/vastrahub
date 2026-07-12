import type { IHeroConfig, IAnnouncementBar, IProductPageConfig, IHomepageBlock } from '@/types';

export const SITE_SETTINGS_SCHEMA_VERSION = 3 as const;

export const SITE_SETTINGS_LIMITS = {
  MAX_HOMEPAGE_BLOCKS: 40,
  MAX_SHOWCASE_CATEGORIES: 24,
  MAX_SHOWCASE_COLLECTIONS: 12,
  MAX_SHOWCASE_PRODUCTS: 24,
  MAX_VIDEOS_PER_BLOCK: 12,
  MAX_HERO_SLIDES: 8,
  MAX_ANNOUNCEMENT_MESSAGES: 10,
  MAX_PRODUCT_INFO_SECTIONS: 12,
} as const;

/** Fresh defaults: only a single hero slide. Everything else starts empty/off. */
export const DEFAULT_HERO: IHeroConfig = {
  version: 1,
  autoplay: false,
  intervalMs: 6000,
  slides: [{
    id: 'default-hero',
    enabled: true,
    heading: 'Welcome to your store',
    subheading: 'Add homepage sections, announcement messages, and product-page details from Settings.',
    alignment: 'center',
    primaryCta: { label: 'Shop now', href: '/shop' },
  }],
};

export const DEFAULT_ANNOUNCEMENT_BAR: IAnnouncementBar = {
  version: 1,
  enabled: false,
  mode: 'simple',
  messages: [''],
  tone: 'default',
};

export const DEFAULT_PRODUCT_PAGE: IProductPageConfig = {
  version: 1,
  estimatedDelivery: { enabled: false, minDays: 3, maxDays: 7 },
  sections: [],
};

export const DEFAULT_HOMEPAGE_BLOCKS: IHomepageBlock[] = [];
