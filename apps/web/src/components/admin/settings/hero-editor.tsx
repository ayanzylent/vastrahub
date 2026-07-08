"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IHeroConfig, BlockAlignment } from "@/types";
import { ResponsiveImageField } from "./responsive-image-field";
import { TextField, TextAreaField, Segmented, CtaFields, SectionLabel } from "./fields";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hero section</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TextField
          label="Badge"
          value={value.badge ?? ""}
          onChange={(v) => set({ badge: v || undefined })}
          placeholder="e.g. New Collection 2026"
          maxLength={60}
        />
        <TextField
          label="Heading"
          value={value.heading}
          onChange={(v) => set({ heading: v })}
          required
          maxLength={160}
        />
        <TextAreaField
          label="Subheading"
          value={value.subheading ?? ""}
          onChange={(v) => set({ subheading: v || undefined })}
          maxLength={400}
        />
        <Segmented<BlockAlignment>
          label="Alignment"
          value={value.alignment}
          onChange={(v) => set({ alignment: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
        />
        <div className="space-y-2">
          <SectionLabel>Background image (per device)</SectionLabel>
          <ResponsiveImageField value={value.image} onChange={(img) => set({ image: img })} />
        </div>
        <CtaFields
          label="Primary button"
          value={value.primaryCta}
          onChange={(v) => set({ primaryCta: v })}
        />
        <CtaFields
          label="Secondary button"
          value={value.secondaryCta}
          onChange={(v) => set({ secondaryCta: v })}
        />
      </CardContent>
    </Card>
  );
}
