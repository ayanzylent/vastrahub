/**
 * Site settings module TypeBox schemas.
 *
 * The homepage is an array of polymorphic blocks. Each block variant is a
 * `Type.Object` tagged by a `Type.Literal('type')`; the array item is a
 * `Type.Union` of all variants. This is where the per-type `config` shape is
 * actually enforced (the Mongoose model stores `config` as Mixed).
 */

import { Type, type Static } from '@sinclair/typebox';
import { ObjectId } from '../../schemas/common.schema.js';
import { SITE_SETTINGS_LIMITS } from '../../constants/index.js';

// ---------- Reusable fragments ----------

const BlockBase = {
  id: Type.String({ minLength: 1, maxLength: 64 }),
  version: Type.Literal(1),
  enabled: Type.Boolean(),
};

const Cta = Type.Object({
  label: Type.String({ minLength: 1, maxLength: 60 }),
  href: Type.String({ minLength: 1, maxLength: 500 }),
});

const ResponsiveImage = Type.Object({
  desktop: Type.Optional(Type.String({ maxLength: 400 })),
  tablet: Type.Optional(Type.String({ maxLength: 400 })),
  mobile: Type.Optional(Type.String({ maxLength: 400 })),
});

const Alignment = Type.Union([
  Type.Literal('left'),
  Type.Literal('center'),
  Type.Literal('right'),
]);

const ShowcaseLayout = Type.Union([Type.Literal('grid'), Type.Literal('carousel')]);

// ---------- Singleton hero (not a block) ----------

const HeroSlide = Type.Object({
  id: Type.String({ minLength: 1, maxLength: 64 }),
  enabled: Type.Boolean(),
  heading: Type.Optional(Type.String({ maxLength: 160 })),
  subheading: Type.Optional(Type.String({ maxLength: 400 })),
  badge: Type.Optional(Type.String({ maxLength: 60 })),
  image: Type.Optional(ResponsiveImage),
  alignment: Alignment,
  primaryCta: Type.Optional(Cta),
  secondaryCta: Type.Optional(Cta),
});

export const Hero = Type.Object({
  version: Type.Literal(1),
  slides: Type.Array(HeroSlide, { minItems: 1, maxItems: SITE_SETTINGS_LIMITS.MAX_HERO_SLIDES }),
  autoplay: Type.Boolean(),
  intervalMs: Type.Integer({ minimum: 2000, maximum: 30000 }),
});

// ---------- Block variants ----------

const CategoryShowcaseBlock = Type.Object({
  ...BlockBase,
  type: Type.Literal('categoryShowcase'),
  config: Type.Object({
    title: Type.Optional(Type.String({ maxLength: 120 })),
    subtitle: Type.Optional(Type.String({ maxLength: 200 })),
    categoryIds: Type.Array(ObjectId, { maxItems: SITE_SETTINGS_LIMITS.MAX_SHOWCASE_CATEGORIES }),
    layout: ShowcaseLayout,
  }),
});

const CollectionShowcaseBlock = Type.Object({
  ...BlockBase,
  type: Type.Literal('collectionShowcase'),
  config: Type.Object({
    title: Type.Optional(Type.String({ maxLength: 120 })),
    subtitle: Type.Optional(Type.String({ maxLength: 200 })),
    collectionIds: Type.Array(ObjectId, { maxItems: SITE_SETTINGS_LIMITS.MAX_SHOWCASE_COLLECTIONS }),
    layout: ShowcaseLayout,
  }),
});

const FeaturedProductsBlock = Type.Object({
  ...BlockBase,
  type: Type.Literal('featuredProducts'),
  config: Type.Object({
    title: Type.Optional(Type.String({ maxLength: 120 })),
    subtitle: Type.Optional(Type.String({ maxLength: 200 })),
    productIds: Type.Array(ObjectId, { maxItems: SITE_SETTINGS_LIMITS.MAX_SHOWCASE_PRODUCTS }),
    layout: ShowcaseLayout,
  }),
});

const VideoEmbedBlock = Type.Object({
  ...BlockBase,
  type: Type.Literal('videoEmbed'),
  config: Type.Object({
    title: Type.Optional(Type.String({ maxLength: 120 })),
    subtitle: Type.Optional(Type.String({ maxLength: 200 })),
    videos: Type.Array(
      Type.Object({
        provider: Type.Union([
          Type.Literal('instagram'),
          Type.Literal('facebook'),
          Type.Literal('youtube'),
        ]),
        url: Type.String({ minLength: 1, maxLength: 600 }),
        caption: Type.Optional(Type.String({ maxLength: 160 })),
      }),
      { maxItems: SITE_SETTINGS_LIMITS.MAX_VIDEOS_PER_BLOCK },
    ),
  }),
});

const BannerBlock = Type.Object({
  ...BlockBase,
  type: Type.Literal('banner'),
  config: Type.Object({
    image: Type.Optional(ResponsiveImage),
    href: Type.Optional(Type.String({ maxLength: 500 })),
    alt: Type.Optional(Type.String({ maxLength: 200 })),
  }),
});

export const HomepageBlock = Type.Union([
  CategoryShowcaseBlock,
  CollectionShowcaseBlock,
  FeaturedProductsBlock,
  VideoEmbedBlock,
  BannerBlock,
]);

export const AnnouncementBar = Type.Object({
  version: Type.Literal(1),
  enabled: Type.Boolean(),
  mode: Type.Union([Type.Literal('simple'), Type.Literal('typewriter')]),
  messages: Type.Array(Type.String({ maxLength: 200 }), {
    minItems: 1,
    maxItems: SITE_SETTINGS_LIMITS.MAX_ANNOUNCEMENT_MESSAGES,
  }),
  linkText: Type.Optional(Type.String({ maxLength: 60 })),
  linkHref: Type.Optional(Type.String({ maxLength: 500 })),
  tone: Type.Union([
    Type.Literal('default'),
    Type.Literal('promo'),
    Type.Literal('info'),
    Type.Literal('warning'),
  ]),
});

const ProductInfoSection = Type.Object({
  id: Type.String({ minLength: 1, maxLength: 64 }),
  version: Type.Literal(1),
  enabled: Type.Boolean(),
  type: Type.Union([
    Type.Literal('returns'),
    Type.Literal('shipping'),
    Type.Literal('seller'),
    Type.Literal('help'),
    Type.Literal('custom'),
  ]),
  icon: Type.Union([
    Type.Literal('rotate'),
    Type.Literal('truck'),
    Type.Literal('store'),
    Type.Literal('help'),
    Type.Literal('info'),
    Type.Literal('shield'),
  ]),
  title: Type.String({ minLength: 1, maxLength: 100 }),
  content: Type.String({ minLength: 1, maxLength: 1200 }),
  linkText: Type.Optional(Type.String({ maxLength: 60 })),
  linkHref: Type.Optional(Type.String({ maxLength: 500 })),
});

export const ProductPage = Type.Object({
  version: Type.Literal(1),
  estimatedDelivery: Type.Object({
    enabled: Type.Boolean(),
    minDays: Type.Integer({ minimum: 0, maximum: 365 }),
    maxDays: Type.Integer({ minimum: 0, maximum: 365 }),
  }),
  sections: Type.Array(ProductInfoSection, {
    maxItems: SITE_SETTINGS_LIMITS.MAX_PRODUCT_INFO_SECTIONS,
  }),
});

// ---------- Request schemas ----------

export const UpdateSiteSettingsBody = Type.Object({
  hero: Hero,
  homepageBlocks: Type.Array(HomepageBlock, { maxItems: SITE_SETTINGS_LIMITS.MAX_HOMEPAGE_BLOCKS }),
  announcementBar: AnnouncementBar,
  productPage: ProductPage,
});
export type UpdateSiteSettingsBodyType = Static<typeof UpdateSiteSettingsBody>;
