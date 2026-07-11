import type {
  IHeroConfig,
  IHomepageBlock,
  IAnnouncementBar,
  IProductPageConfig,
} from '../types/index.js';

export const SITE_SETTINGS_SCHEMA_VERSION = 2 as const;

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
  MAX_HERO_SLIDES: 8,
  MAX_ANNOUNCEMENT_MESSAGES: 10,
  MAX_PRODUCT_INFO_SECTIONS: 12,
} as const;

/** Default hero — mirrors the previously-hardcoded hero so it looks identical. */
export const DEFAULT_HERO: IHeroConfig = {
  version: 1,
  autoplay: true,
  intervalMs: 6000,
  slides: [{
    id: 'default-hero',
    enabled: true,
    badge: 'New Collection 2026',
    heading: 'Premium Indian Fashion, Redefined',
    subheading:
      "Discover handpicked elegance from India's finest weavers and designers. From heritage handlooms to contemporary chic — your wardrobe transformation starts here.",
    alignment: 'center',
    primaryCta: { label: 'Shop New Arrivals', href: '/shop?sortBy=newest' },
    secondaryCta: { label: 'Explore Collections', href: '/shop' },
  }],
};

/** Announcement bar is off until an admin configures it. */
export const DEFAULT_ANNOUNCEMENT_BAR: IAnnouncementBar = {
  version: 1,
  enabled: false,
  mode: 'simple',
  messages: [''],
  linkText: '',
  linkHref: '',
  tone: 'default',
};

export const DEFAULT_PRODUCT_PAGE: IProductPageConfig = {
  version: 1,
  estimatedDelivery: {
    enabled: true,
    minDays: 3,
    maxDays: 7,
  },
  sections: [
    {
      id: 'default-returns',
      version: 1,
      enabled: true,
      type: 'returns',
      icon: 'rotate',
      title: 'Return & Exchange',
      content: 'Easy returns and exchanges within 7 days of delivery.',
    },
    {
      id: 'default-shipping',
      version: 1,
      enabled: true,
      type: 'shipping',
      icon: 'truck',
      title: 'Shipping Information',
      content: 'Orders are carefully packed and dispatched with trusted delivery partners.',
    },
    {
      id: 'default-seller',
      version: 1,
      enabled: true,
      type: 'seller',
      icon: 'store',
      title: 'Seller Information',
      content: 'Sold and fulfilled by Vastrahub.',
    },
    {
      id: 'default-help',
      version: 1,
      enabled: true,
      type: 'help',
      icon: 'help',
      title: 'Need Help?',
      content: 'Contact our support team for product, order, or delivery assistance.',
    },
  ],
};

/**
 * Default homepage blocks (below the hero) — the category / collection /
 * featured-product showcases from the old homepage. Showcase blocks ship with
 * empty id lists; the storefront falls back to the same "top / featured"
 * queries until an admin curates specific items.
 *
 * Block ids are stable literals (no runtime randomness needed for seeding).
 */
export const DEFAULT_HOMEPAGE_BLOCKS: IHomepageBlock[] = [
  {
    id: 'default-categories',
    version: 1,
    type: 'categoryShowcase',
    enabled: true,
    config: {
      title: 'Shop by Category',
      subtitle: 'Explore our curated collections',
      categoryIds: [],
      layout: 'grid',
    },
  },
  {
    id: 'default-collections',
    version: 1,
    type: 'collectionShowcase',
    enabled: true,
    config: {
      title: 'Shop by Collection',
      subtitle: 'Curated edits, handpicked for the season',
      collectionIds: [],
    },
  },
  {
    id: 'default-featured',
    version: 1,
    type: 'featuredProducts',
    enabled: true,
    config: {
      title: 'Featured Products',
      subtitle: 'Handpicked for you',
      productIds: [],
    },
  },
];
