import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IHeroConfig } from "@vastrahub/shared-types";
import { ResponsivePicture } from "./responsive-picture";

/**
 * Singleton hero. Rendered server-side (ISR) at the very top of the homepage —
 * fed by its own `/storefront/hero` endpoint for fast, cacheable first paint.
 */
export function HeroSection({ hero }: { hero: IHeroConfig }) {
  const hasImage = !!(hero.image?.desktop || hero.image?.tablet || hero.image?.mobile);

  const textAlign =
    hero.alignment === "left"
      ? "text-left items-start"
      : hero.alignment === "right"
        ? "text-right items-end"
        : "text-center items-center";
  const justify =
    hero.alignment === "left"
      ? "justify-start"
      : hero.alignment === "right"
        ? "justify-end"
        : "justify-center";
  const mx = hero.alignment === "center" ? "mx-auto" : "";

  return (
    <section className="relative overflow-hidden py-20 md:py-32 lg:py-40">
      {hasImage ? (
        <>
          <ResponsivePicture
            image={hero.image}
            alt={hero.heading}
            className="absolute inset-0 -z-10 block h-full w-full"
            imgClassName="h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-background/70" />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full bg-chart-2/10 blur-3xl" />
        </div>
      )}

      <div className={`relative mx-auto flex max-w-7xl flex-col px-4 md:px-6 ${textAlign}`}>
        {hero.badge && (
          <Badge variant="default" className="mb-6 px-4 py-1.5 text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            {hero.badge}
          </Badge>
        )}

        <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {hero.heading}
          </span>
        </h1>

        {hero.subheading && (
          <p className={`mt-6 max-w-2xl text-lg text-muted-foreground ${mx}`}>{hero.subheading}</p>
        )}

        {(hero.primaryCta || hero.secondaryCta) && (
          <div className={`mt-8 flex flex-wrap items-center gap-4 ${justify}`}>
            {hero.primaryCta && (
              <Button variant="default" size="lg" asChild>
                <Link href={hero.primaryCta.href}>
                  {hero.primaryCta.label}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
            {hero.secondaryCta && (
              <Button variant="outline" size="lg" asChild>
                <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
              </Button>
            )}
          </div>
        )}

        {/* Trust badges */}
        <div
          className={`mt-12 flex flex-wrap items-center gap-8 text-sm text-muted-foreground ${justify}`}
        >
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <span>4.9/5 Rating</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>50K+ Happy Customers</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Handpicked Quality</span>
          </div>
        </div>
      </div>
    </section>
  );
}
