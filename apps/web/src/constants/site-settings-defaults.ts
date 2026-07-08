import type { IHeroConfig, IHomepageBlock, IAnnouncementBar } from '@/types';

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
} as const;

/** Default hero — mirrors the previously-hardcoded hero so it looks identical. */
export const DEFAULT_HERO: IHeroConfig = {
  badge: 'New Collection 2026',
  heading: 'Premium Indian Fashion, Redefined',
  subheading:
    "Discover handpicked elegance from India's finest weavers and designers. From heritage handlooms to contemporary chic — your wardrobe transformation starts here.",
  alignment: 'center',
  primaryCta: { label: 'Shop New Arrivals', href: '/categories/new-arrivals' },
  secondaryCta: { label: 'Explore Collections', href: '/categories/all' },
};

/** Announcement bar is off until an admin configures it. */
export const DEFAULT_ANNOUNCEMENT_BAR: IAnnouncementBar = {
  enabled: false,
  message: '',
  linkText: '',
  linkHref: '',
  tone: 'default',
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
    type: 'featuredProducts',
    enabled: true,
    config: {
      title: 'Featured Products',
      subtitle: 'Handpicked for you',
      productIds: [],
    },
  },
];
