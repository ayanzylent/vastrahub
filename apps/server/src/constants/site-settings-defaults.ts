import type {
  IHeroConfig,
  IHomepageBlock,
  IAnnouncementBar,
  IProductPageConfig,
} from '../types/index.js';

export const SITE_SETTINGS_SCHEMA_VERSION = 3 as const;

/**
 * Limits for the homepage block builder (enforced by TypeBox `maxItems` on the
 * admin update endpoint and by the admin UI).
 */
export const SITE_SETTINGS_LIMITS = {
  MAX_HOMEPAGE_BLOCKS: 40,
  MAX_SHOWCASE_CATEGORIES: 24,
  MAX_SHOWCASE_COLLECTIONS: 12,
  MAX_SHOWCASE_PRODUCTS: 24,
  MAX_VIDEOS_PER_BLOCK: 12,
  MAX_LOGO_MARQUEE_ITEMS: 24,
  MAX_HERO_SLIDES: 8,
  MAX_ANNOUNCEMENT_MESSAGES: 10,
  MAX_PRODUCT_INFO_CONTENT: 1200,
  MAX_PRODUCT_INFO_LINK_TEXT: 60,
  MAX_PRODUCT_INFO_LINK_HREF: 500,
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
  version: 2,
  estimatedDelivery: {
    enabled: false,
    minDays: 3,
    maxDays: 7,
  },
  badges: {
    easyReturn: false,
    easyReplacement: false,
    cod: false,
    freeDelivery: false,
    authentic: false,
  },
  returnAndExchange: {},
  shippingInformation: {},
  sellerInformation: {},
};

export const DEFAULT_HOMEPAGE_BLOCKS: IHomepageBlock[] = [];
