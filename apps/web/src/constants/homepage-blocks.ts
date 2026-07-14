import type { BlockType } from "@/types";

/** Canonical homepage block type order (admin add-menu + storefront renderers). */
export const HOMEPAGE_BLOCK_TYPES: BlockType[] = [
  "categoryShowcase",
  "collectionShowcase",
  "featuredProducts",
  "videoEmbed",
  "banner",
  "imageMosaic",
  "logoMarquee",
];
