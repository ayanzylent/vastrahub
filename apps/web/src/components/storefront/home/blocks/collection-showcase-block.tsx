import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ICollectionShowcaseBlock, ICollection } from "@/types";
import { CollectionCard } from "./collection-card";
import { CollectionShowcaseCarousel } from "./collection-showcase-carousel";
import { HOME_BLOCK_HEADER_CLASS, HomeBlockSection } from "./home-block-section";

export function CollectionShowcaseBlock({
  block,
}: {
  block: ICollectionShowcaseBlock & { resolved?: ICollection[] };
}) {
  const collections = block.resolved ?? [];
  if (collections.length === 0) return null;

  const c = block.config ?? { collectionIds: [], layout: "grid" as const };
  const layout = c.layout ?? "grid";

  return (
    <HomeBlockSection className="bg-card/50">
      <div className={`flex items-center justify-between ${HOME_BLOCK_HEADER_CLASS}`}>
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold">
            {c.title || "Shop by Collection"}
          </h2>
          {c.subtitle && <p className="mt-2 text-muted-foreground">{c.subtitle}</p>}
        </div>
        <Button variant="ghost" asChild>
          <Link href="/collections">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {layout === "carousel" ? (
        <CollectionShowcaseCarousel collections={collections} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {collections.map((col) => (
            <CollectionCard key={col._id} col={col} />
          ))}
        </div>
      )}
    </HomeBlockSection>
  );
}
