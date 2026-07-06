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
import { SITE_SETTINGS_LIMITS } from '@vastrahub/shared-constants';

// ---------- Reusable fragments ----------

const BlockBase = {
  id: Type.String({ minLength: 1, maxLength: 64 }),
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

// ---------- Singleton hero (not a block) ----------

export const Hero = Type.Object({
  heading: Type.String({ minLength: 1, maxLength: 160 }),
  subheading: Type.Optional(Type.String({ maxLength: 400 })),
  badge: Type.Optional(Type.String({ maxLength: 60 })),
  image: Type.Optional(ResponsiveImage),
  alignment: Alignment,
  primaryCta: Type.Optional(Cta),
  secondaryCta: Type.Optional(Cta),
});

// ---------- Block variants ----------

const CategoryShowcaseBlock = Type.Object({
  ...BlockBase,
  type: Type.Literal('categoryShowcase'),
  config: Type.Object({
    title: Type.Optional(Type.String({ maxLength: 120 })),
    subtitle: Type.Optional(Type.String({ maxLength: 200 })),
    categoryIds: Type.Array(ObjectId, { maxItems: SITE_SETTINGS_LIMITS.MAX_SHOWCASE_CATEGORIES }),
    layout: Type.Union([Type.Literal('grid'), Type.Literal('carousel')]),
  }),
});

const CollectionShowcaseBlock = Type.Object({
  ...BlockBase,
  type: Type.Literal('collectionShowcase'),
  config: Type.Object({
    title: Type.Optional(Type.String({ maxLength: 120 })),
    subtitle: Type.Optional(Type.String({ maxLength: 200 })),
    collectionIds: Type.Array(ObjectId, { maxItems: SITE_SETTINGS_LIMITS.MAX_SHOWCASE_COLLECTIONS }),
  }),
});

const FeaturedProductsBlock = Type.Object({
  ...BlockBase,
  type: Type.Literal('featuredProducts'),
  config: Type.Object({
    title: Type.Optional(Type.String({ maxLength: 120 })),
    subtitle: Type.Optional(Type.String({ maxLength: 200 })),
    productIds: Type.Array(ObjectId, { maxItems: SITE_SETTINGS_LIMITS.MAX_SHOWCASE_PRODUCTS }),
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
  enabled: Type.Boolean(),
  message: Type.String({ maxLength: 200 }),
  linkText: Type.Optional(Type.String({ maxLength: 60 })),
  linkHref: Type.Optional(Type.String({ maxLength: 500 })),
  tone: Type.Union([
    Type.Literal('default'),
    Type.Literal('promo'),
    Type.Literal('info'),
    Type.Literal('warning'),
  ]),
});

// ---------- Request schemas ----------

export const UpdateSiteSettingsBody = Type.Object({
  hero: Hero,
  homepageBlocks: Type.Array(HomepageBlock, { maxItems: SITE_SETTINGS_LIMITS.MAX_HOMEPAGE_BLOCKS }),
  announcementBar: AnnouncementBar,
});
export type UpdateSiteSettingsBodyType = Static<typeof UpdateSiteSettingsBody>;
