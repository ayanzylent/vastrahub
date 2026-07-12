"use client";

import { useState } from "react";
import { Upload, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { getMediaUrl } from "@/lib/media";
import type { ResponsiveImage } from "@/types";

type Viewport = "desktop" | "tablet" | "mobile";

const SLOTS: Array<{ key: Viewport; label: string; hint: string; aspect: string }> = [
  { key: "desktop", label: "Desktop", hint: "Wide · ~1920×720", aspect: "aspect-[16/6]" },
  { key: "tablet", label: "Tablet", hint: "Optional · ~1280×720", aspect: "aspect-[16/9]" },
  { key: "mobile", label: "Mobile", hint: "Optional · ~800×1000", aspect: "aspect-[4/5]" },
];

interface ResponsiveImageFieldProps {
  value: ResponsiveImage | undefined;
  onChange: (next: ResponsiveImage) => void;
}

/**
 * Uploads up to three per-viewport banner images (desktop / tablet / mobile).
 * Desktop is the base; the storefront falls back to it when tablet/mobile are
 * empty. Reuses the R2 presigned-upload pipeline (context: "homepage").
 */
export function ResponsiveImageField({ value, onChange }: ResponsiveImageFieldProps) {
  const image = value ?? {};
  const [uploading, setUploading] = useState<Viewport | null>(null);

  async function upload(slot: Viewport, file: File) {
    setUploading(slot);
    try {
      const urlRes = await api.post<{ uploadUrl: string; key: string }>(
        "/api/v1/media/upload-url",
        {
          type: "image",
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          context: "homepage",
        },
      );
      if (!urlRes.success || !urlRes.data) {
        toast.error(urlRes.error || "Failed to get upload URL");
        return;
      }
      const uploadRes = await fetch(urlRes.data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) {
        toast.error("Upload failed");
        return;
      }
      onChange({ ...image, [slot]: urlRes.data.key });
      toast.success(`${slot} image uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(null);
    }
  }

  function clearSlot(slot: Viewport) {
    const next = { ...image };
    delete next[slot];
    onChange(next);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {SLOTS.map((slot) => {
        const key = image[slot.key];
        const inputId = `resp-img-${slot.key}`;
        return (
          <div key={slot.key} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label className="text-sm">{slot.label}</Label>
              <span className="text-[11px] text-muted-foreground">{slot.hint}</span>
            </div>
            {key ? (
              <div className="relative overflow-hidden rounded-md border border-border/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getMediaUrl(key)}
                  alt={`${slot.label} banner`}
                  className={`w-full object-cover ${slot.aspect}`}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => clearSlot(slot.key)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div
                className={`flex items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20 ${slot.aspect}`}
              >
                <span className="text-xs text-muted-foreground px-3 text-center">
                  At least one device image required
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id={inputId}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(slot.key, file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled={uploading === slot.key}
              onClick={() => document.getElementById(inputId)?.click()}
            >
              {uploading === slot.key ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" /> {key ? "Replace" : "Upload"}</>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
