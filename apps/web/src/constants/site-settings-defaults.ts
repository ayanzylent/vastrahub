import type { IHeroConfig, IAnnouncementBar } from '@/types';

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


