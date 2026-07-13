"use client";

import { useState } from "react";
import { Upload, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { getMediaUrl } from "@/lib/media";

interface LogoImageFieldProps {
  instanceId: string;
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  label?: string;
  hint?: string;
  emptyHint?: string;
  required?: boolean;
}

/** Single-image upload for logo marquee items (R2 context: homepage). */
export function LogoImageField({
  instanceId,
  value,
  onChange,
  label,
  hint,
  emptyHint = "No image",
  required = false,
}: LogoImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const inputId = `logo-img-${instanceId}`;

  async function upload(file: File) {
    setUploading(true);
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
      onChange(urlRes.data.key);
      toast.success("Logo uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {(label || hint) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && <Label className="text-sm">{label}</Label>}
          {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
        </div>
      )}
      {value ? (
        <div className="relative flex h-20 items-center justify-center overflow-hidden rounded-md border border-border/50 bg-muted/30 px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getMediaUrl(value)}
            alt="Logo preview"
            className="max-h-14 max-w-full object-contain"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={() => onChange(undefined)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20">
          <span className="px-3 text-center text-xs text-muted-foreground">
            {required ? "Logo image required" : emptyHint}
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
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={uploading}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" /> {value ? "Replace" : "Upload"}
          </>
        )}
      </Button>
    </div>
  );
}
