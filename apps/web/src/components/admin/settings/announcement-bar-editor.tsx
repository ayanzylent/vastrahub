"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IAnnouncementBar, AnnouncementTone } from "@/types";
import { FieldToggle } from "./field-toggle";

const TONES: Array<{ value: AnnouncementTone; label: string }> = [
  { value: "default", label: "Default" },
  { value: "promo", label: "Promo" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
];

export function AnnouncementBarEditor({
  value,
  onChange,
}: {
  value: IAnnouncementBar;
  onChange: (v: IAnnouncementBar) => void;
}) {
  const set = (patch: Partial<IAnnouncementBar>) => onChange({ ...value, ...patch });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Announcement bar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <FieldToggle
          id="ann-enabled"
          checked={value.enabled}
          onChange={(v) => set({ enabled: v })}
          label="Show announcement bar"
          desc="A dismissible message shown at the very top of every storefront page"
        />

        <div className="space-y-2">
          <Label>Message</Label>
          <Input
            value={value.message}
            onChange={(e) => set({ message: e.target.value })}
            placeholder="e.g. Free shipping on orders over ₹999"
            maxLength={200}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Link text (optional)</Label>
            <Input
              value={value.linkText ?? ""}
              onChange={(e) => set({ linkText: e.target.value || undefined })}
              placeholder="Shop now"
              maxLength={60}
            />
          </div>
          <div className="space-y-2">
            <Label>Link URL (optional)</Label>
            <Input
              value={value.linkHref ?? ""}
              onChange={(e) => set({ linkHref: e.target.value || undefined })}
              placeholder="/collections/sale"
              maxLength={500}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tone</Label>
          <div className="flex gap-1.5 flex-wrap">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => set({ tone: t.value })}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  value.tone === t.value
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border/50 text-muted-foreground hover:bg-muted/30"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
