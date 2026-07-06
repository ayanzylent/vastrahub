import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMediaUrl } from "@/lib/media";
import type { ICollectionShowcaseBlock, ICollection } from "@vastrahub/shared-types";

export function CollectionShowcaseBlock({
  block,
}: {
  block: ICollectionShowcaseBlock & { resolved?: ICollection[] };
}) {
  const collections = block.resolved ?? [];
  if (collections.length === 0) return null;

  const c = block.config;

  return (
    <section className="py-16 md:py-24 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex items-center justify-between mb-10">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {collections.map((col) => {
            const image = col.bannerImage || col.image;
            return (
              <Link key={col._id} href={`/collections/${col.slug}`}>
                <Card className="group overflow-hidden hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center overflow-hidden">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getMediaUrl(image)}
                          alt={col.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-3xl font-heading font-bold text-primary/30 group-hover:text-primary/50 transition-colors">
                          {col.name[0]}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-heading text-lg font-semibold group-hover:text-primary transition-colors">
                        {col.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                        {col.description || `${col.productCount} products`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
