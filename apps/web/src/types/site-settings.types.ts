import type { ICategory } from './category.types';
import type { ICollection } from './collection.types';
import type { IProduct } from './product.types';

/** Versioned, admin-configurable storefront settings. */

/** A call-to-action button (label + link). */
export interface ICta {
  label: string;
  href: string;
}

/** Horizontal alignment for text-based blocks. */
export type BlockAlignment = 'left' | 'center' | 'right';

/**
 * Per-viewport banner image (R2 media keys).
 * `desktop` is the base/fallback; `tablet` and `mobile` are optional and, when
 * absent, fall back to `desktop`. Rendered via a `<picture>` element so each
 * viewport can be served a differently-cropped image (art direction).
 */
export interface ResponsiveImage {
  desktop?: string;
  tablet?: string;
  mobile?: string;
}

// ---------- Hero (singleton — NOT a block) ----------

export interface IHeroSlide {
  id: string;
  enabled: boolean;
  heading?: string;
  subheading?: string;
  badge?: string;
  image?: ResponsiveImage;
  alignment: BlockAlignment;
  primaryCta?: ICta;
  secondaryCta?: ICta;
}

export interface IHeroConfig {
  version: 1;
  slides: IHeroSlide[];
  autoplay: boolean;
  intervalMs: number;
}

// ---------- Block config shapes ----------

interface ICategoryShowcaseConfig {
  title?: string;
  subtitle?: string;
  /** Explicitly curated & ordered category ids. Empty => auto (top active categories). */
  categoryIds: string[];
  layout: 'grid' | 'carousel';
}

interface ICollectionShowcaseConfig {
  title?: string;
  subtitle?: string;
  /** Explicitly curated & ordered collection ids. Empty => featured collections. */
  collectionIds: string[];
}

interface IFeaturedProductsConfig {
  title?: string;
  subtitle?: string;
  /** Explicitly curated & ordered product ids. Empty => featured products. */
  productIds: string[];
}

export type VideoProvider = 'instagram' | 'facebook' | 'youtube';

export interface IVideoEmbedItem {
  provider: VideoProvider;
  url: string;
  caption?: string;
}

interface IVideoEmbedConfig {
  title?: string;
  subtitle?: string;
  videos: IVideoEmbedItem[];
}

/**
 * A pure image banner. It has NO text/CTA — just a per-viewport image and an
 * optional link. Rendered at its natural aspect ratio (height adapts to the
 * image) so banners of slightly different sizes are not stretched or cropped.
 */
interface IBannerConfig {
  image?: ResponsiveImage;
  href?: string;
  alt?: string;
}

// ---------- Discriminated block union ----------

interface IBlockBase {
  /** Stable id, generated client-side (crypto.randomUUID) when a block is added. */
  id: string;
  version: 1;
  enabled: boolean;
}

export interface ICategoryShowcaseBlock extends IBlockBase {
  type: 'categoryShowcase';
  config: ICategoryShowcaseConfig;
}
export interface ICollectionShowcaseBlock extends IBlockBase {
  type: 'collectionShowcase';
  config: ICollectionShowcaseConfig;
}
export interface IFeaturedProductsBlock extends IBlockBase {
  type: 'featuredProducts';
  config: IFeaturedProductsConfig;
}
export interface IVideoEmbedBlock extends IBlockBase {
  type: 'videoEmbed';
  config: IVideoEmbedConfig;
}
export interface IBannerBlock extends IBlockBase {
  type: 'banner';
  config: IBannerConfig;
}

export type IHomepageBlock =
  | ICategoryShowcaseBlock
  | ICollectionShowcaseBlock
  | IFeaturedProductsBlock
  | IVideoEmbedBlock
  | IBannerBlock;

export type BlockType = IHomepageBlock['type'];

// ---------- Announcement bar ----------

export type AnnouncementTone = 'default' | 'promo' | 'info' | 'warning';
export type AnnouncementMode = 'simple' | 'typewriter';

/** A global, dismissible top-of-site message (not a block). */
export interface IAnnouncementBar {
  version: 1;
  enabled: boolean;
  mode: AnnouncementMode;
  messages: string[];
  linkText?: string;
  linkHref?: string;
  tone: AnnouncementTone;
}

// ---------- Site settings ----------

export type ProductInfoType = 'returns' | 'shipping' | 'seller' | 'help' | 'custom';
export type ProductInfoIcon = 'rotate' | 'truck' | 'store' | 'help' | 'info' | 'shield';

export interface IEstimatedDeliveryConfig {
  enabled: boolean;
  minDays: number;
  maxDays: number;
}

export interface IProductInfoSection {
  id: string;
  version: 1;
  enabled: boolean;
  type: ProductInfoType;
  icon: ProductInfoIcon;
  title: string;
  content: string;
  linkText?: string;
  linkHref?: string;
}

export interface IProductPageConfig {
  version: 1;
  estimatedDelivery: IEstimatedDeliveryConfig;
  sections: IProductInfoSection[];
}

export interface ISiteSettings {
  schemaVersion: 3;
  hero: IHeroConfig;
  homepageBlocks: IHomepageBlock[];
  announcementBar: IAnnouncementBar;
  productPage: IProductPageConfig;
}

// ---------- Hydrated (storefront) ----------

/**
 * Storefront variant: showcase blocks have their curated ids resolved into the
 * actual (ordered, visibility-filtered) documents by the server. Hero and the
 * announcement bar are fetched via their own dedicated endpoints.
 */
export type IHydratedHomepageBlock =
  | (ICategoryShowcaseBlock & { resolved: ICategory[] })
  | (ICollectionShowcaseBlock & { resolved: ICollection[] })
  | (IFeaturedProductsBlock & { resolved: IProduct[] })
  | IVideoEmbedBlock
  | IBannerBlock;

export interface IHydratedSiteSettings {
  homepageBlocks: IHydratedHomepageBlock[];
  announcementBar: IAnnouncementBar;
}
