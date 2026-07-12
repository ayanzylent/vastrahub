"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { IAnnouncementBar, AnnouncementMode, AnnouncementTone } from "@/types";
import { SITE_SETTINGS_LIMITS } from "@/constants";
import { FieldToggle } from "./field-toggle";
import { Segmented } from "./fields";

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
  const messages = value.messages.length > 0 ? value.messages : [""];

  const updateMessage = (index: number, message: string) => {
    set({ messages: messages.map((item, i) => i === index ? message : item) });
  };

  const moveMessage = (index: number, delta: number) => {
    const next = [...messages];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set({ messages: next });
  };

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

        <Segmented<AnnouncementMode>
          label="Display mode"
          value={value.mode}
          onChange={(mode) => {
            if (mode === "simple") {
              set({ mode, messages: [messages[0] ?? ""] });
              return;
            }
            set({ mode });
          }}
          options={[
            { value: "simple", label: "Simple" },
            { value: "typewriter", label: "Typewriter" },
          ]}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label>{value.mode === "simple" ? "Message" : "Sentences"}</Label>
            {value.mode === "typewriter" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={messages.length >= SITE_SETTINGS_LIMITS.MAX_ANNOUNCEMENT_MESSAGES}
                onClick={() => set({ messages: [...messages, ""] })}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add sentence
              </Button>
            )}
          </div>
          {(value.mode === "simple" ? messages.slice(0, 1) : messages).map((message, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={message}
                onChange={(e) => updateMessage(index, e.target.value)}
                placeholder="e.g. Free shipping on orders over ₹999"
                maxLength={200}
              />
              {value.mode === "typewriter" && (
                <>
                  <Button type="button" size="icon" variant="ghost" disabled={index === 0} onClick={() => moveMessage(index, -1)} aria-label="Move sentence up">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" disabled={index === messages.length - 1} onClick={() => moveMessage(index, 1)} aria-label="Move sentence down">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={messages.length === 1}
                    onClick={() => set({ messages: messages.filter((_, i) => i !== index) })}
                    aria-label="Remove sentence"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
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
