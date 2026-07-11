import type { IHeroConfig, IAnnouncementBar, IProductPageConfig } from '@/types';

export const SITE_SETTINGS_SCHEMA_VERSION = 2 as const;

export const SITE_SETTINGS_LIMITS = {
  MAX_HOMEPAGE_BLOCKS: 40,
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
  estimatedDelivery: { enabled: true, minDays: 3, maxDays: 7 },
  sections: [
    { id: 'default-returns', version: 1, enabled: true, type: 'returns', icon: 'rotate', title: 'Return & Exchange', content: 'Easy returns and exchanges within 7 days of delivery.' },
    { id: 'default-shipping', version: 1, enabled: true, type: 'shipping', icon: 'truck', title: 'Shipping Information', content: 'Orders are carefully packed and dispatched with trusted delivery partners.' },
    { id: 'default-seller', version: 1, enabled: true, type: 'seller', icon: 'store', title: 'Seller Information', content: 'Sold and fulfilled by Vastrahub.' },
    { id: 'default-help', version: 1, enabled: true, type: 'help', icon: 'help', title: 'Need Help?', content: 'Contact our support team for product, order, or delivery assistance.' },
  ],
};


