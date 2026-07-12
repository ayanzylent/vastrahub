"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { IHeroConfig, IHeroSlide, BlockAlignment } from "@/types";
import { SITE_SETTINGS_LIMITS } from "@/constants";
import { ResponsiveImageField } from "./responsive-image-field";
import { TextField, TextAreaField, Segmented, CtaFields, SectionLabel } from "./fields";
import { FieldToggle } from "./field-toggle";

/**
 * Editor for the singleton hero. The hero is not a block — it's fixed at the
 * top of the homepage and served by its own ISR-cached storefront endpoint.
 */
export function HeroEditor({
  value,
  onChange,
}: {
  value: IHeroConfig;
  onChange: (v: IHeroConfig) => void;
}) {
  const set = (patch: Partial<IHeroConfig>) => onChange({ ...value, ...patch });
  const updateSlide = (index: number, patch: Partial<IHeroSlide>) => {
    set({ slides: value.slides.map((slide, i) => i === index ? { ...slide, ...patch } : slide) });
  };
  const moveSlide = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.slides.length) return;
    const slides = [...value.slides];
    [slides[index], slides[target]] = [slides[target], slides[index]];
    set({ slides });
  };
  const addSlide = () => set({
    slides: [...value.slides, {
      id: crypto.randomUUID(),
      enabled: true,
      alignment: "center",
    }],
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Hero carousel</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addSlide} disabled={value.slides.length >= SITE_SETTINGS_LIMITS.MAX_HERO_SLIDES}>
            <Plus className="mr-1 h-4 w-4" /> Add slide
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldToggle id="hero-autoplay" checked={value.autoplay} onChange={(autoplay) => set({ autoplay })} label="Autoplay slides" desc="Automatically advance through enabled slides" />
          {value.autoplay && (
            <TextField label="Interval (milliseconds)" value={String(value.intervalMs)} onChange={(interval) => set({ intervalMs: Math.min(30000, Math.max(2000, Number(interval) || 6000)) })} />
          )}
        </CardContent>
      </Card>

      {value.slides.map((slide, index) => (
        <Card key={slide.id}>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Slide {index + 1}</CardTitle>
            <div className="flex items-center gap-1">
              <Button type="button" size="icon" variant="ghost" disabled={index === 0} onClick={() => moveSlide(index, -1)} aria-label="Move slide up"><ArrowUp className="h-4 w-4" /></Button>
              <Button type="button" size="icon" variant="ghost" disabled={index === value.slides.length - 1} onClick={() => moveSlide(index, 1)} aria-label="Move slide down"><ArrowDown className="h-4 w-4" /></Button>
              <Button type="button" size="icon" variant="ghost" disabled={value.slides.length === 1} onClick={() => set({ slides: value.slides.filter((_, i) => i !== index) })} aria-label="Remove slide"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldToggle id={`hero-slide-${slide.id}`} checked={slide.enabled} onChange={(enabled) => updateSlide(index, { enabled })} label="Show this slide" />
            <TextField label="Badge" value={slide.badge ?? ""} onChange={(badge) => updateSlide(index, { badge: badge || undefined })} placeholder="e.g. New Collection 2026" maxLength={60} />
            <TextField label="Heading" value={slide.heading ?? ""} onChange={(heading) => updateSlide(index, { heading: heading || undefined })} maxLength={160} />
            <TextAreaField label="Subheading" value={slide.subheading ?? ""} onChange={(subheading) => updateSlide(index, { subheading: subheading || undefined })} maxLength={400} />
            <Segmented<BlockAlignment>
              label="Alignment"
              value={slide.alignment}
              onChange={(alignment) => updateSlide(index, { alignment })}
              options={[
                { value: "left", label: "Left" },
                { value: "center", label: "Center" },
                { value: "right", label: "Right" },
              ]}
            />
            <div className="space-y-2">
              <SectionLabel>Background image (per device)</SectionLabel>
              <ResponsiveImageField instanceId={slide.id} value={slide.image} onChange={(image) => updateSlide(index, { image })} />
            </div>
            <CtaFields label="Primary button" value={slide.primaryCta} onChange={(primaryCta) => updateSlide(index, { primaryCta })} />
            <CtaFields label="Secondary button" value={slide.secondaryCta} onChange={(secondaryCta) => updateSlide(index, { secondaryCta })} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
