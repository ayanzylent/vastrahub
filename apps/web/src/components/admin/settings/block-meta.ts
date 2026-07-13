import {
  FolderTree,
  LayoutGrid,
  Package,
  Video,
  Image as ImageIcon,
  Images,
  type LucideIcon,
} from "lucide-react";
import type { BlockType, IHomepageBlock } from "@/types";

export interface BlockMeta {
  type: BlockType;
  label: string;
  description: string;
  icon: LucideIcon;
}

/** Display order in the "Add block" menu. */
export const BLOCK_TYPES: BlockType[] = [
  "categoryShowcase",
  "collectionShowcase",
  "featuredProducts",
  "videoEmbed",
  "banner",
  "imageMosaic",
];

export const BLOCK_META: Record<BlockType, BlockMeta> = {
  categoryShowcase: {
    type: "categoryShowcase",
    label: "Category showcase",
    description: "Hand-picked categories in a grid or carousel",
    icon: FolderTree,
  },
  collectionShowcase: {
    type: "collectionShowcase",
    label: "Collection showcase",
    description: "Feature specific collections",
    icon: LayoutGrid,
  },
  featuredProducts: {
    type: "featuredProducts",
    label: "Featured products",
    description: "Curate a row of products",
    icon: Package,
  },
  videoEmbed: {
    type: "videoEmbed",
    label: "Video / Social",
    description: "Embed Instagram, Facebook or YouTube videos",
    icon: Video,
  },
  banner: {
    type: "banner",
    label: "Image banner",
    description: "A full-width image banner (adaptive height)",
    icon: ImageIcon,
  },
  imageMosaic: {
    type: "imageMosaic",
    label: "Image mosaic",
    description: "4 promotional image tiles in a responsive layout",
    icon: Images,
  },
};

/** A short human label for a block, preferring its configured title. */
export function blockTitle(block: IHomepageBlock): string {
  const c = (block.config ?? {}) as Record<string, unknown>;
  const candidate = c.title as string | undefined;
  if (candidate && candidate.trim()) return candidate.trim();
  return BLOCK_META[block.type]?.label ?? "Unsupported block";
}

/** Build a new block with sensible defaults. Id is generated client-side. */
export function createBlock(type: BlockType): IHomepageBlock {
  const id = crypto.randomUUID();
  const base = { id, version: 1 as const, enabled: true };

  switch (type) {
    case "categoryShowcase":
      return {
        ...base,
        type,
        config: { title: "Shop by Category", categoryIds: [], layout: "grid" },
      };
    case "collectionShowcase":
      return {
        ...base,
        type,
        config: { title: "Shop by Collection", collectionIds: [], layout: "grid" },
      };
    case "featuredProducts":
      return {
        ...base,
        type,
        config: { title: "Featured Products", productIds: [], layout: "grid" },
      };
    case "videoEmbed":
      return {
        ...base,
        type,
        config: { title: "Watch & Shop", videos: [] },
      };
    case "banner":
      return {
        ...base,
        type,
        config: {},
      };
    case "imageMosaic":
      return {
        ...base,
        type,
        config: { items: [{}, {}, {}, {}] },
      };
  }
}
