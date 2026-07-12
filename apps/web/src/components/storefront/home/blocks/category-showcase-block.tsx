import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMediaUrl } from "@/lib/media";
import type { ICategoryShowcaseBlock, ICategory } from "@/types";
import { CategoryShowcaseCarousel } from "./category-showcase-carousel";

function CategoryCard({ cat }: { cat: ICategory }) {
  return (
    <Link href={`/categories/${cat.slug}`}>
      <Card className="group overflow-hidden hover:border-primary/30 transition-all duration-300">
        <CardContent className="p-0">
          <div className="aspect-[4/5] bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center overflow-hidden">
            {cat.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getMediaUrl(cat.image)}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <span className="text-3xl font-heading font-bold text-primary/30 group-hover:text-primary/50 transition-colors">
                {cat.name[0]}
              </span>
            )}
          </div>
          <div className="p-3 text-center">
            <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
              {cat.name}
            </h3>
            <p className="text-xs text-muted-foreground">{cat.productCount} items</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function CategoryShowcaseBlock({
  block,
}: {
  block: ICategoryShowcaseBlock & { resolved?: ICategory[] };
}) {
  const categories = block.resolved ?? [];
  if (categories.length === 0) return null;

  const c = block.config;
  const layout = c.layout ?? "grid";

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold">
              {c.title || "Shop by Category"}
            </h2>
            {c.subtitle && <p className="mt-2 text-muted-foreground">{c.subtitle}</p>}
          </div>
          <Button variant="ghost" asChild>
            <Link href="/categories">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {layout === "carousel" ? (
          <CategoryShowcaseCarousel categories={categories} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <CategoryCard key={cat._id} cat={cat} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
