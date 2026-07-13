import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ICategoryShowcaseBlock, ICategory } from "@/types";
import { CategoryCard } from "@/components/storefront/category-card";
import { CategoryShowcaseCarousel } from "./category-showcase-carousel";
import { HOME_BLOCK_HEADER_CLASS, HomeBlockSection } from "./home-block-section";

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
    <HomeBlockSection>
      <div className={`flex items-center justify-between ${HOME_BLOCK_HEADER_CLASS}`}>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {categories.map((cat) => (
            <CategoryCard key={cat._id} cat={cat} />
          ))}
        </div>
      )}
    </HomeBlockSection>
  );
}
