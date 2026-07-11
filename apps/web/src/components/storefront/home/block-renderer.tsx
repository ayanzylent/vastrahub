import type { ComponentType } from "react";
import type { BlockType, IHydratedHomepageBlock } from "@/types";
import { CategoryShowcaseBlock } from "./blocks/category-showcase-block";
import { CollectionShowcaseBlock } from "./blocks/collection-showcase-block";
import { FeaturedProductsBlock } from "./blocks/featured-products-block";
import { VideoEmbedBlock } from "./blocks/video-embed-block";
import { BannerBlock } from "./blocks/banner-block";

/**
 * Renders hydrated homepage blocks in order. The switch narrows each block to
 * its specific (resolved) variant for the matching component.
 */
export function BlockRenderer({ blocks }: { blocks: IHydratedHomepageBlock[] }) {
  return (
    <>
      {blocks.map((block) => {
        const Component = BLOCK_RENDERERS[block.type] as ComponentType<{ block: typeof block }> | undefined;
        return Component ? <Component key={block.id} block={block} /> : null;
      })}
    </>
  );
}

const BLOCK_RENDERERS = {
  categoryShowcase: CategoryShowcaseBlock,
  collectionShowcase: CollectionShowcaseBlock,
  featuredProducts: FeaturedProductsBlock,
  videoEmbed: VideoEmbedBlock,
  banner: BannerBlock,
} satisfies Record<BlockType, ComponentType<never>>;
