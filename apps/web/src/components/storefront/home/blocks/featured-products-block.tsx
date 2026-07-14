import { ProductCard, type ProductCardProduct } from "@/components/storefront/catalog/product-card";
import type { IFeaturedProductsBlock, IProduct } from "@/types";
import { FeaturedProductsCarousel } from "./featured-products-carousel";
import { HOME_BLOCK_HEADER_CLASS, HomeBlockSection } from "./home-block-section";

export function FeaturedProductsBlock({
  block,
}: {
  block: IFeaturedProductsBlock & { resolved?: IProduct[] };
}) {
  const products = block.resolved ?? [];
  if (products.length === 0) return null;

  const c = block.config ?? { productIds: [], layout: "grid" as const };
  const layout = c.layout ?? "grid";

  return (
    <HomeBlockSection className="bg-card/50">
      <div className={`flex items-center justify-between ${HOME_BLOCK_HEADER_CLASS}`}>
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold">
            {c.title || "Featured Products"}
          </h2>
          {c.subtitle && <p className="mt-2 text-muted-foreground">{c.subtitle}</p>}
        </div>
      </div>

      {layout === "carousel" ? (
        <FeaturedProductsCarousel products={products} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product as unknown as ProductCardProduct}
              lowestPricePaise={product.basePricePaise}
              lowestMrpPaise={product.baseMrpPaise}
            />
          ))}
        </div>
      )}
    </HomeBlockSection>
  );
}
