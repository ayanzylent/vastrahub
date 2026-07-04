"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard, type ProductCardProduct } from "@/components/shared/product-card";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/media";
import type { ICategory, ICollection } from "@vastrahub/shared-types";

interface FeaturedProduct extends ProductCardProduct {
  skus?: Array<{ pricePaise: number; mrpPaise: number }>;
}

export default function HomePage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [collections, setCollections] = useState<ICollection[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await api.get<ICategory[]>("/api/v1/storefront/categories");
        if (res.success && res.data) {
          setCategories(res.data.slice(0, 6));
        }
      } catch {
        // fallback to empty
      } finally {
        setLoadingCats(false);
      }
    }

    async function fetchCollections() {
      try {
        const res = await api.get<ICollection[]>("/api/v1/storefront/collections?featured=true");
        if (res.success && res.data) {
          setCollections(res.data.slice(0, 6));
        }
      } catch {
        // fallback to empty
      } finally {
        setLoadingCollections(false);
      }
    }

    async function fetchFeatured() {
      try {
        const res = await api.get<FeaturedProduct[]>("/api/v1/storefront/products/featured");
        if (res.success && res.data) {
          setFeaturedProducts(res.data.slice(0, 8));
        }
      } catch {
        // fallback to empty
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchCategories();
    fetchCollections();
    fetchFeatured();
  }, []);

  return (
    <div className="flex flex-col">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden py-20 md:py-32 lg:py-40">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full bg-chart-2/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 md:px-6 text-center">
          <Badge variant="default" className="mb-6 px-4 py-1.5 text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            New Collection 2026
          </Badge>

          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Premium Indian</span>
            <br />
            <span className="text-foreground">Fashion, </span>
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Redefined</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Discover handpicked elegance from India&apos;s finest weavers and
            designers. From heritage handlooms to contemporary chic — your
            wardrobe transformation starts here.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button variant="default" size="lg" asChild>
              <Link href="/categories/new-arrivals">
                Shop New Arrivals
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/categories/all">Explore Collections</Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
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

      {/* ─── Featured Categories ─── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold">
                Shop by Category
              </h2>
              <p className="mt-2 text-muted-foreground">
                Explore our curated collections
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/categories/all">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {loadingCats
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-0">
                      <Skeleton className="aspect-[4/5] w-full" />
                      <div className="p-3 text-center space-y-1">
                        <Skeleton className="h-4 w-2/3 mx-auto" />
                        <Skeleton className="h-3 w-1/2 mx-auto" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              : categories.map((cat) => (
                  <Link key={cat._id} href={`/categories/${cat.slug}`}>
                    <Card className="group overflow-hidden hover:border-primary/30 transition-all duration-300">
                      <CardContent className="p-0">
                        <div className="aspect-[4/5] bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center overflow-hidden">
                          {cat.image ? (
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
                          <p className="text-xs text-muted-foreground">
                            {cat.productCount} items
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* ─── Shop by Collection ─── */}
      {(loadingCollections || collections.length > 0) && (
        <section className="py-16 md:py-24 bg-card/50">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="font-heading text-2xl md:text-3xl font-bold">
                  Shop by Collection
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Curated edits, handpicked for the season
                </p>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/collections">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {loadingCollections
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardContent className="p-0">
                        <Skeleton className="aspect-[16/9] w-full" />
                        <div className="p-4 space-y-2">
                          <Skeleton className="h-5 w-1/2" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                : collections.map((col) => {
                    const image = col.bannerImage || col.image;
                    return (
                      <Link key={col._id} href={`/collections/${col.slug}`}>
                        <Card className="group overflow-hidden hover:border-primary/30 transition-all duration-300">
                          <CardContent className="p-0">
                            <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center overflow-hidden">
                              {image ? (
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
      )}

      {/* ─── Featured Products ─── */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold">
                Featured Products
              </h2>
              <p className="mt-2 text-muted-foreground">
                Handpicked for you
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/categories/all">
                See All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {loadingProducts
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-0">
                      <Skeleton className="aspect-[3/4] w-full rounded-none" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <div className="flex items-center justify-between pt-1">
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              : featuredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    lowestPricePaise={product.skus?.[0]?.pricePaise ?? product.basePricePaise}
                    lowestMrpPaise={product.skus?.[0]?.mrpPaise ?? product.baseMrpPaise}
                  />
                ))}
            {!loadingProducts && featuredProducts.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">
                  No featured products yet. Check back soon!
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-8 md:p-16">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-0 right-0 h-[300px] w-[300px] rounded-full bg-chart-2/10 blur-3xl" />
            </div>
            <div className="relative text-center">
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-primary-foreground">
                Get 20% Off Your First Order
              </h2>
              <p className="mt-4 text-primary-foreground/80 max-w-lg mx-auto">
                Sign up today and get exclusive access to our newest collections
                plus ₹500 off on your first purchase.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/signup">Create Account</Link>
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className=""
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
