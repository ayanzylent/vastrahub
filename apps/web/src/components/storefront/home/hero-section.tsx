"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IHeroConfig } from "@/types";
import { hasResponsiveImage } from "@/lib/responsive-image";
import { ResponsivePicture } from "./responsive-picture";

/**
 * Singleton hero. Rendered server-side (ISR) at the very top of the homepage —
 * fed by its own `/storefront/hero` endpoint for fast, cacheable first paint.
 */
export function HeroSection({ hero }: { hero: IHeroConfig }) {
  const slides = useMemo(() => hero.slides.filter((slide) => slide.enabled), [hero.slides]);
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<number | null>(null);
  const goTo = (index: number) => setCurrent((index + slides.length) % slides.length);

  useEffect(() => {
    if (!hero.autoplay || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setCurrent((index) => (index + 1) % slides.length), hero.intervalMs);
    return () => window.clearInterval(timer);
  }, [hero.autoplay, hero.intervalMs, slides.length]);

  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [current, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      className="relative min-h-[520px] overflow-hidden md:min-h-[650px]"
      aria-roledescription="carousel"
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta = event.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(delta) > 50) goTo(current + (delta < 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      {slides.map((slide, index) => {
        const hasImage = hasResponsiveImage(slide.image);
        const imageHref = slide.imageHref?.trim();
        const textAlign = slide.alignment === "left" ? "text-left items-start" : slide.alignment === "right" ? "text-right items-end" : "text-center items-center";
        const justify = slide.alignment === "left" ? "justify-start" : slide.alignment === "right" ? "justify-end" : "justify-center";
        const mx = slide.alignment === "center" ? "mx-auto" : "";
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 flex items-center py-20 transition-opacity duration-700 motion-reduce:transition-none ${index === current ? "z-10 opacity-100" : "pointer-events-none opacity-0"}`}
            aria-hidden={index !== current}
          >
            {hasImage ? (
              <>
                <ResponsivePicture image={slide.image} alt="" className="absolute inset-0 -z-10 block h-full w-full" imgClassName="h-full w-full object-cover" />
                <div className="absolute inset-0 -z-10 bg-background/30" />
              </>
            ) : (
              <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full bg-chart-2/10 blur-3xl" />
              </div>
            )}
            {imageHref && (
              <Link
                href={imageHref}
                className="absolute inset-0 z-0"
                aria-label={slide.heading?.trim() || `View slide ${index + 1}`}
                tabIndex={index === current ? 0 : -1}
              />
            )}
            <div className={`relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 md:px-6 pointer-events-none ${textAlign}`}>
              {slide.badge && <Badge variant="default" className="mb-6 px-4 py-1.5 text-xs pointer-events-auto"><Sparkles className="mr-1 h-3 w-3" />{slide.badge}</Badge>}
              {slide.heading?.trim() && (
                <h1 className="font-heading text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
                  <span className="text-primary">{slide.heading}</span>
                </h1>
              )}
              {slide.subheading && <p className={`${slide.heading?.trim() ? "mt-6" : ""} max-w-2xl text-lg text-muted-foreground ${mx}`}>{slide.subheading}</p>}
              {(slide.primaryCta || slide.secondaryCta) && (
                <div className={`mt-8 flex flex-wrap items-center gap-4 pointer-events-auto ${justify}`}>
                  {slide.primaryCta && <Button variant="default" size="lg" asChild><Link href={slide.primaryCta.href}>{slide.primaryCta.label}<ArrowRight className="ml-1 h-4 w-4" /></Link></Button>}
                  {slide.secondaryCta && <Button variant="outline" size="lg" asChild><Link href={slide.secondaryCta.href}>{slide.secondaryCta.label}</Link></Button>}
                </div>
              )}

            </div>
          </div>
        );
      })}
      {slides.length > 1 && (
        <>
          <div className="absolute left-3 top-1/2 z-20 -translate-y-1/2">
            <Button type="button" size="icon" variant="secondary" className="rounded-full" onClick={() => goTo(current - 1)} aria-label="Previous hero slide">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute right-3 top-1/2 z-20 -translate-y-1/2">
            <Button type="button" size="icon" variant="secondary" className="rounded-full" onClick={() => goTo(current + 1)} aria-label="Next hero slide">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => <button key={slide.id} type="button" onClick={() => goTo(index)} aria-label={`Show hero slide ${index + 1}`} aria-current={index === current} className={`h-2 rounded-full transition-all ${index === current ? "w-7 bg-primary" : "w-2 bg-foreground/35"}`} />)}
          </div>
        </>
      )}
    </section>
  );
}
