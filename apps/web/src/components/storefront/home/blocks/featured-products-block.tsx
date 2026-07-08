import { ProductCard, type ProductCardProduct } from "@/components/shared/product-card";
import type { IFeaturedProductsBlock, IProduct } from "@/types";

export function FeaturedProductsBlock({
  block,
}: {
  block: IFeaturedProductsBlock & { resolved?: IProduct[] };
}) {
  const products = block.resolved ?? [];
  const c = block.config;

  return (
    <section className="py-16 md:py-24 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold">
              {c.title || "Featured Products"}
            </h2>
            {c.subtitle && <p className="mt-2 text-muted-foreground">{c.subtitle}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product as unknown as ProductCardProduct}
              lowestPricePaise={product.basePricePaise}
              lowestMrpPaise={product.baseMrpPaise}
            />
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No featured products yet. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
