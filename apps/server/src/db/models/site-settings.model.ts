/**
 * SiteSettings model — a singleton document holding the admin-configurable
 * storefront homepage (an ordered array of blocks) and the global announcement
 * bar.
 *
 * Only ever ONE document exists, guaranteed by the unique `key: 'singleton'`.
 * Per-block `config` is stored as `Schema.Types.Mixed` (house style, mirroring
 * Collection.rules[].value): the polymorphic shape is validated by TypeBox at
 * the API boundary, keeping Mongoose permissive and full-array replaces atomic.
 */

import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type {
  IHeroConfig,
  IHomepageBlock,
  IAnnouncementBar,
  BlockType,
} from '@vastrahub/shared-types';

// ---------- Interfaces ----------

export interface ISiteSettingsDocument extends Document {
  key: 'singleton';
  hero: IHeroConfig;
  homepageBlocks: IHomepageBlock[];
  announcementBar: IAnnouncementBar;
  createdAt: Date;
  updatedAt: Date;
}

const BLOCK_TYPES: BlockType[] = [
  'categoryShowcase',
  'collectionShowcase',
  'featuredProducts',
  'videoEmbed',
  'banner',
];

// ---------- Sub-schemas ----------

const blockSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true, enum: BLOCK_TYPES },
    enabled: { type: Boolean, default: true },
    // Mixed: shape depends on `type`, enforced by TypeBox on the update route.
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const announcementBarSchema = new Schema<IAnnouncementBar>(
  {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: '', maxlength: 200 },
    linkText: { type: String, default: '', maxlength: 60 },
    linkHref: { type: String, default: '', maxlength: 500 },
    tone: {
      type: String,
      enum: ['default', 'promo', 'info', 'warning'],
      default: 'default',
    },
  },
  { _id: false },
);

// ---------- Schema ----------

const siteSettingsSchema = new Schema<ISiteSettingsDocument>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'singleton',
      enum: ['singleton'],
    },
    // Singleton hero config; shape enforced by TypeBox on the update route.
    hero: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    homepageBlocks: {
      type: [blockSchema],
      default: [],
    },
    announcementBar: {
      type: announcementBarSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    collection: 'site_settings',
  },
);

// ---------- Export ----------

export const SiteSettings: Model<ISiteSettingsDocument> = mongoose.models.SiteSettings
  || mongoose.model<ISiteSettingsDocument>('SiteSettings', siteSettingsSchema);
