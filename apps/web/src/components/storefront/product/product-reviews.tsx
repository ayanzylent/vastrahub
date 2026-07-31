"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, ChevronDown, Loader2, MessageSquareText, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { WriteReviewForm } from "@/components/storefront/product/write-review-form";

interface ReviewMediaItem {
  type: "image" | "video";
  url: string;
  alt?: string;
  sortOrder?: number;
  mimeType?: string;
}

interface ProductReview {
  _id: string;
  rating: number;
  title?: string;
  body?: string;
  userName?: string;
  isVerifiedPurchase?: boolean;
  media?: ReviewMediaItem[];
  createdAt?: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

type SortBy = "newest" | "highest" | "lowest";

type EligibilityState =
  | { status: "idle" | "loading" | "guest" }
  | {
      status: "ready";
      eligible: boolean;
      alreadyReviewed: boolean;
      orderId: string | null;
      reason: string | null;
    };

interface ProductReviewsProps {
  productId: string;
}

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "highest", label: "Highest" },
  { value: "lowest", label: "Lowest" },
];

function StarRow({
  rating,
  size = "sm",
  className,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const iconClass =
    size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn(
            iconClass,
            value <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

function formatReviewDate(value?: string) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function initialsFromName(name?: string) {
  if (!name?.trim()) return "C";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "C";
}

function RatingDistribution({
  distribution,
  total,
}: {
  distribution: Record<number, number>;
  total: number;
}) {
  return (
    <div className="space-y-1.5 w-full max-w-xs">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-3 tabular-nums text-muted-foreground">{star}</span>
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400/90 transition-[width] duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right tabular-nums text-muted-foreground">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewCard({
  review,
  onOpenPhoto,
}: {
  review: ProductReview;
  onOpenPhoto: (url: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const body = review.body?.trim() ?? "";
  const isLong = body.length > 220;
  const displayBody =
    !expanded && isLong ? `${body.slice(0, 220).trimEnd()}…` : body;
  const images = (review.media ?? []).filter((m) => m.type === "image" && m.url);
  const name = review.userName || "Customer";

  return (
    <li className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300 py-6 first:pt-0">
      <div className="flex gap-3 sm:gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
          aria-hidden
        >
          {initialsFromName(name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-sm font-semibold text-foreground">{name}</span>
            {review.isVerifiedPurchase && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                <BadgeCheck className="h-3 w-3" />
                Verified buyer
              </span>
            )}
            {review.createdAt && (
              <span className="text-xs text-muted-foreground">
                {formatReviewDate(review.createdAt)}
              </span>
            )}
          </div>

          <StarRow rating={review.rating} className="mt-1.5" />

          {review.title && (
            <h3 className="mt-2.5 text-sm font-semibold leading-snug">
              {review.title}
            </h3>
          )}

          {body && (
            <div className="mt-1.5">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {displayBody}
              </p>
              {isLong && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-foreground/80 hover:text-foreground transition-colors"
                >
                  {expanded ? "Show less" : "Read more"}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
              )}
            </div>
          )}

          {images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((media, idx) => {
                const src = getMediaUrl(media.url);
                return (
                  <button
                    key={`${review._id}-${idx}`}
                    type="button"
                    className="group relative h-18 w-18 overflow-hidden rounded-lg border border-border/60 bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => onOpenPhoto(src)}
                    aria-label="View review photo"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={media.alt || "Review photo"}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { data: session, isPending: sessionPending } = useSession();
  const isLoggedIn = !!session?.user;

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [eligibility, setEligibility] = useState<EligibilityState>({
    status: "idle",
  });
  const [checkingWrite, setCheckingWrite] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchReviews = useCallback(
    async (nextPage: number, sort: SortBy, replace: boolean) => {
      if (replace) setLoading(true);
      else setLoadingMore(true);

      try {
        const qs = new URLSearchParams({
          page: String(nextPage),
          limit: "10",
          sortBy: sort,
        });
        const res = await api.paginated<ProductReview>(
          `/api/v1/storefront/products/${productId}/reviews?${qs.toString()}`,
        );

        if (!res.success) {
          if (replace) {
            setReviews([]);
            setTotal(0);
            setTotalPages(1);
          }
          return;
        }

        setReviews((prev) => (replace ? res.data : [...prev, ...res.data]));
        setPage(res.pagination.page);
        setTotalPages(res.pagination.totalPages);
        setTotal(res.pagination.total);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [productId],
  );

  const fetchStats = useCallback(async () => {
    const res = await api.get<ReviewStats>(
      `/api/v1/storefront/products/${productId}/reviews/stats`,
    );
    if (res.success && res.data) setStats(res.data);
  }, [productId]);

  useEffect(() => {
    void fetchReviews(1, sortBy, true);
    void fetchStats();
  }, [fetchReviews, fetchStats, sortBy]);

  useEffect(() => {
    if (sessionPending) {
      setEligibility({ status: "loading" });
      return;
    }

    if (!isLoggedIn) {
      setEligibility({ status: "guest" });
      return;
    }

    let cancelled = false;
    setEligibility({ status: "loading" });

    void (async () => {
      const res = await api.get<{
        eligible: boolean;
        alreadyReviewed: boolean;
        orderId: string | null;
        reason: string | null;
      }>(`/api/v1/reviews/eligibility/${productId}`);

      if (cancelled) return;

      if (!res.success || !res.data) {
        setEligibility({
          status: "ready",
          eligible: false,
          alreadyReviewed: false,
          orderId: null,
          reason: res.error || "Could not verify purchase",
        });
        return;
      }

      setEligibility({
        status: "ready",
        eligible: res.data.eligible,
        alreadyReviewed: res.data.alreadyReviewed,
        orderId: res.data.orderId,
        reason: res.data.reason,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, productId, sessionPending]);

  const showWriteButton =
    eligibility.status === "ready" && eligibility.eligible;

  const buyerHint = useMemo(() => {
    if (eligibility.status !== "ready") return null;
    if (eligibility.alreadyReviewed) return "You've already reviewed this product.";
    if (!eligibility.eligible) {
      return "Only verified buyers can write a review after delivery.";
    }
    return null;
  }, [eligibility]);

  async function handleWriteClick() {
    if (eligibility.status !== "ready" || !eligibility.eligible) return;

    setCheckingWrite(true);
    try {
      // Re-check right before opening (order/status may have changed)
      const res = await api.get<{
        eligible: boolean;
        alreadyReviewed: boolean;
        orderId: string | null;
        reason: string | null;
      }>(`/api/v1/reviews/eligibility/${productId}`);

      if (!res.success || !res.data?.eligible || !res.data.orderId) {
        toast.error(
          res.data?.reason ||
            "You can only review products you have purchased and received",
        );
        setEligibility({
          status: "ready",
          eligible: false,
          alreadyReviewed: !!res.data?.alreadyReviewed,
          orderId: null,
          reason: res.data?.reason ?? null,
        });
        return;
      }

      setEligibility({
        status: "ready",
        eligible: true,
        alreadyReviewed: false,
        orderId: res.data.orderId,
        reason: null,
      });
      setWriteOpen(true);
    } catch {
      toast.error("Could not verify purchase");
    } finally {
      setCheckingWrite(false);
    }
  }

  const average = stats?.averageRating ?? 0;
  const statsTotal = stats?.totalReviews ?? total;

  return (
    <section id="reviews" className="mt-10 md:mt-14 scroll-mt-24">
      <Separator className="mb-8" />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h2 className="font-heading text-lg md:text-xl font-bold tracking-tight">
            Customer reviews
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real feedback from verified buyers
          </p>
        </div>

        {showWriteButton && (
          <Button
            type="button"
            onClick={() => void handleWriteClick()}
            disabled={checkingWrite}
            className="self-start sm:self-auto"
          >
            {checkingWrite ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening…
              </>
            ) : (
              "Write a review"
            )}
          </Button>
        )}
      </div>

      {/* Summary strip */}
      {!loading && statsTotal > 0 && stats && (
        <div className="mb-8 flex flex-col gap-5 rounded-xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:gap-8 sm:p-5">
          <div className="shrink-0 text-center sm:text-left sm:min-w-30">
            <div className="font-heading text-4xl font-bold tabular-nums tracking-tight">
              {average.toFixed(1)}
            </div>
            <StarRow rating={Math.round(average)} size="md" className="mt-1.5 justify-center sm:justify-start" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Based on {statsTotal} {statsTotal === 1 ? "review" : "reviews"}
            </p>
          </div>
          <div className="hidden sm:block h-20 w-px bg-border/70" aria-hidden />
          <RatingDistribution
            distribution={stats.distribution}
            total={statsTotal}
          />
        </div>
      )}

      {buyerHint && isLoggedIn && (
        <p className="mb-4 text-xs text-muted-foreground">{buyerHint}</p>
      )}

      {/* Sort */}
      {!loading && reviews.length > 0 && (
        <div
          className="mb-4 flex flex-wrap items-center gap-1.5"
          role="tablist"
          aria-label="Sort reviews"
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={sortBy === option.value}
              onClick={() => setSortBy(option.value)}
              className={cn(
                "h-8 rounded-full px-3 text-xs font-medium transition-colors",
                sortBy === option.value
                  ? "bg-foreground text-background"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/15 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MessageSquareText className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-heading text-base font-semibold">
            No reviews yet
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            {showWriteButton
              ? "You bought this product — share your experience and help other shoppers."
              : "Reviews from verified buyers will show up here."}
          </p>
          {showWriteButton && (
            <Button
              type="button"
              className="mt-5"
              onClick={() => void handleWriteClick()}
              disabled={checkingWrite}
            >
              Write the first review
            </Button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-border/50">
          {reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              onOpenPhoto={setLightboxUrl}
            />
          ))}
        </ul>
      )}

      {!loading && page < totalPages && (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            disabled={loadingMore}
            onClick={() => void fetchReviews(page + 1, sortBy, false)}
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              "Load more reviews"
            )}
          </Button>
        </div>
      )}

      <WriteReviewForm
        productId={productId}
        orderId={
          eligibility.status === "ready" ? eligibility.orderId : null
        }
        open={writeOpen}
        onOpenChange={setWriteOpen}
        onSubmitted={() => {
          void fetchReviews(1, sortBy, true);
          void fetchStats();
          setEligibility((prev) =>
            prev.status === "ready"
              ? {
                  ...prev,
                  eligible: false,
                  alreadyReviewed: true,
                  orderId: null,
                  reason: "You've already reviewed this product.",
                }
              : prev,
          );
        }}
      />

      <Dialog open={!!lightboxUrl} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="sm:max-w-2xl p-2 bg-background/95" showCloseButton>
          <DialogTitle className="sr-only">Review photo</DialogTitle>
          {lightboxUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightboxUrl}
              alt="Review photo"
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
