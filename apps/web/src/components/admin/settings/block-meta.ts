import {
  FolderTree,
  LayoutGrid,
  Package,
  Video,
  Image as ImageIcon,
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
];

export const BLOCK_META: Record<BlockType, BlockMeta> = {
  categoryShowcase: {
    type: "categoryShowcase",
    label: "Category showcase",
    description: "A grid of hand-picked categories",
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
};

/** A short human label for a block, preferring its configured title. */
export function blockTitle(block: IHomepageBlock): string {
  const c = block.config as unknown as Record<string, unknown>;
  const candidate = c.title as string | undefined;
  if (candidate && candidate.trim()) return candidate.trim();
  return BLOCK_META[block.type].label;
}

/** Build a new block with sensible defaults. Id is generated client-side. */
export function createBlock(type: BlockType): IHomepageBlock {
  const id = crypto.randomUUID();
  const base = { id, enabled: true };

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
        config: { title: "Shop by Collection", collectionIds: [] },
      };
    case "featuredProducts":
      return {
        ...base,
        type,
        config: { title: "Featured Products", productIds: [] },
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
  }
}
