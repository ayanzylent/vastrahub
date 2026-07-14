"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard, type ProductCardProduct } from "@/components/storefront/catalog/product-card";
import type { IProduct } from "@/types";

export function FeaturedProductsCarousel({ products }: { products: IProduct[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-carousel-card]");
    const gap = 16;
    const step = (card?.offsetWidth ?? 160) + gap;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-roledescription="carousel"
      >
        {products.map((product) => (
          <div
            key={product._id}
            data-carousel-card
            className="w-[calc(50%-8px)] shrink-0 snap-start md:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]"
          >
            <ProductCard
              product={product as unknown as ProductCardProduct}
              lowestPricePaise={product.basePricePaise}
              lowestMrpPaise={product.baseMrpPaise}
            />
          </div>
        ))}
      </div>
      {products.length > 2 && (
        <>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 rounded-full shadow-md sm:flex"
            onClick={() => scroll(-1)}
            aria-label="Scroll products left"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 rounded-full shadow-md sm:flex"
            onClick={() => scroll(1)}
            aria-label="Scroll products right"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}
    </div>
  );
}
