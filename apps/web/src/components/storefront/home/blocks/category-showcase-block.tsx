import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMediaUrl } from "@/lib/media";
import type { ICategoryShowcaseBlock, ICategory } from "@/types";
import { CategoryShowcaseCarousel } from "./category-showcase-carousel";

function CategoryCard({ cat }: { cat: ICategory }) {
  return (
    <Link href={`/categories/${cat.slug}`} className="block">
      <div className="group overflow-hidden rounded-xl bg-card text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10 hover:border-primary/30 transition-all duration-300">
        <div className="relative aspect-[4/5] bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center overflow-hidden">
          {cat.image ? (
            <Image
              src={getMediaUrl(cat.image)}
              alt={cat.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
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
      </div>
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

  const c = block.config ?? { categoryIds: [], layout: "grid" as const };
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
