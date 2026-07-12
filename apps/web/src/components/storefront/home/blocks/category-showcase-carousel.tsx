"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMediaUrl } from "@/lib/media";
import type { ICategory } from "@/types";

function CategoryCard({ cat }: { cat: ICategory }) {
  return (
    <Link href={`/categories/${cat.slug}`} className="block h-full">
      <Card className="group h-full overflow-hidden hover:border-primary/30 transition-all duration-300">
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

export function CategoryShowcaseCarousel({ categories }: { categories: ICategory[] }) {
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
        {categories.map((cat) => (
          <div
            key={cat._id}
            data-carousel-card
            className="w-[calc(50%-8px)] shrink-0 snap-start sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(16.666%-14px)]"
          >
            <CategoryCard cat={cat} />
          </div>
        ))}
      </div>
      {categories.length > 2 && (
        <>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 rounded-full shadow-md sm:flex"
            onClick={() => scroll(-1)}
            aria-label="Scroll categories left"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 rounded-full shadow-md sm:flex"
            onClick={() => scroll(1)}
            aria-label="Scroll categories right"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}
    </div>
  );
}
