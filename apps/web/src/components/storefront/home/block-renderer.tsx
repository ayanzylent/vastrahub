import type { IHydratedHomepageBlock } from "@vastrahub/shared-types";
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
        switch (block.type) {
          case "categoryShowcase":
            return <CategoryShowcaseBlock key={block.id} block={block} />;
          case "collectionShowcase":
            return <CollectionShowcaseBlock key={block.id} block={block} />;
          case "featuredProducts":
            return <FeaturedProductsBlock key={block.id} block={block} />;
          case "videoEmbed":
            return <VideoEmbedBlock key={block.id} block={block} />;
          case "banner":
            return <BannerBlock key={block.id} block={block} />;
          default:
            return null;
        }
      })}
    </>
  );
}
