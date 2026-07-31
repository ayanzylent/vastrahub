"use client";

import { useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

const MAX_PHOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export interface ReviewMediaPayload {
  type: "image";
  url: string;
  alt: string;
  sortOrder: number;
  mimeType: string;
}

interface PendingPhoto {
  id: string;
  previewUrl: string;
  media: ReviewMediaPayload;
}

interface WriteReviewFormProps {
  productId: string;
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}

export function WriteReviewForm({
  productId,
  orderId,
  open,
  onOpenChange,
  onSubmitted,
}: WriteReviewFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending: sessionPending } = useSession();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setRating(0);
    setHoverRating(0);
    setTitle("");
    setBody("");
    setPhotos((prev) => {
      for (const p of prev) URL.revokeObjectURL(p.previewUrl);
      return [];
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  function requireLogin(): boolean {
    if (sessionPending) return false;
    if (!session?.user) {
      const callbackUrl = pathname || window.location.pathname;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return false;
    }
    return true;
  }

  async function uploadFile(file: File): Promise<PendingPhoto | null> {
    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error("Only JPEG, PNG, or WebP images are allowed");
      return null;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Each photo must be 5MB or smaller");
      return null;
    }

    const urlRes = await api.post<{ uploadUrl: string; key: string }>(
      "/api/v1/media/upload-url",
      {
        type: "image",
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        context: "review",
      },
    );

    if (!urlRes.success || !urlRes.data) {
      toast.error(urlRes.error || "Failed to get upload URL");
      return null;
    }

    const uploadRes = await fetch(urlRes.data.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) {
      toast.error("Photo upload failed");
      return null;
    }

    const previewUrl = URL.createObjectURL(file);
    return {
      id: crypto.randomUUID(),
      previewUrl,
      media: {
        type: "image",
        url: urlRes.data.key,
        alt: file.name,
        sortOrder: 0,
        mimeType: file.type,
      },
    };
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    if (!requireLogin()) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`You can add up to ${MAX_PHOTOS} photos`);
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded: PendingPhoto[] = [];
      for (const file of selected) {
        const photo = await uploadFile(file);
        if (photo) uploaded.push(photo);
      }
      if (uploaded.length) {
        setPhotos((prev) => {
          const next = [...prev, ...uploaded].slice(0, MAX_PHOTOS);
          return next.map((p, i) => ({
            ...p,
            media: { ...p.media, sortOrder: i },
          }));
        });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev
        .filter((p) => p.id !== id)
        .map((p, i) => ({ ...p, media: { ...p.media, sortOrder: i } }));
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!requireLogin()) return;
    if (!orderId) {
      toast.error("You can only review products you have purchased and received");
      return;
    }
    if (rating < 1) {
      toast.error("Please select a star rating");
      return;
    }
    if (uploading) {
      toast.error("Wait for photo uploads to finish");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/api/v1/reviews", {
        productId,
        orderId,
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        media: photos.length ? photos.map((p) => p.media) : undefined,
      });

      if (!res.success) {
        if (res.statusCode === 409) {
          toast.error("You have already reviewed this product");
        } else {
          toast.error(res.error || "Failed to post review");
        }
        return;
      }

      toast.success("Review posted");
      handleOpenChange(false);
      onSubmitted();
    } catch {
      toast.error("Failed to post review");
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write a review</DialogTitle>
          <DialogDescription>
            Only customers who purchased and received this product can review.
            Photos are optional (up to {MAX_PHOTOS}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  className="p-0.5 text-muted-foreground hover:text-amber-500 transition-colors"
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(value)}
                >
                  <Star
                    className={cn(
                      "h-7 w-7",
                      value <= displayRating && "fill-amber-400 text-amber-400",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-title">Title (optional)</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Sum up your review"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-body">Review (optional)</Label>
            <textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="What did you like or dislike?"
              className="w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm dark:bg-input/30"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label>Photos (optional)</Label>
              <span className="text-[11px] text-muted-foreground">
                {photos.length}/{MAX_PHOTOS} · JPEG, PNG, WebP · max 5MB
              </span>
            </div>

            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative h-20 w-20 overflow-hidden rounded-md border border-border/60 bg-muted/30"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.previewUrl || getMediaUrl(photo.media.url)}
                      alt={photo.media.alt || "Review photo"}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white"
                      onClick={() => removePhoto(photo.id)}
                      aria-label="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              accept={ACCEPT}
              multiple
              className="sr-only"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={uploading || photos.length >= MAX_PHOTOS}
              onClick={() => {
                if (!requireLogin()) return;
                fileInputRef.current?.click();
              }}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {uploading ? "Uploading…" : "Add photos"}
            </Button>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || uploading || rating < 1 || !orderId}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting…
                </>
              ) : (
                "Post review"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
