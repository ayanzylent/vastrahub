"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SITE_SETTINGS_LIMITS } from "@/constants";
import type {
  IProductInfoSection,
  IProductPageConfig,
  ProductInfoIcon,
  ProductInfoType,
} from "@/types";
import { FieldToggle } from "./field-toggle";
import { selectCls, TextAreaField, TextField } from "./fields";

const TYPES: Array<{ value: ProductInfoType; label: string }> = [
  { value: "returns", label: "Return & Exchange" },
  { value: "shipping", label: "Shipping Information" },
  { value: "seller", label: "Seller Information" },
  { value: "help", label: "Need Help" },
  { value: "custom", label: "Custom" },
];

const ICONS: Array<{ value: ProductInfoIcon; label: string }> = [
  { value: "rotate", label: "Return" },
  { value: "truck", label: "Truck" },
  { value: "store", label: "Store" },
  { value: "help", label: "Help" },
  { value: "info", label: "Information" },
  { value: "shield", label: "Shield" },
];

export function ProductPageEditor({
  value,
  onChange,
}: {
  value: IProductPageConfig;
  onChange: (value: IProductPageConfig) => void;
}) {
  const set = (patch: Partial<IProductPageConfig>) => onChange({ ...value, ...patch });
  const updateSection = (index: number, patch: Partial<IProductInfoSection>) => {
    set({ sections: value.sections.map((section, i) => i === index ? { ...section, ...patch } : section) });
  };
  const moveSection = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.sections.length) return;
    const sections = [...value.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    set({ sections });
  };
  const addSection = () => set({
    sections: [...value.sections, {
      id: crypto.randomUUID(),
      version: 1,
      enabled: true,
      type: "custom",
      icon: "info",
      title: "New information",
      content: "Add information shown to customers.",
    }],
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estimated delivery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldToggle
            id="estimated-delivery-enabled"
            checked={value.estimatedDelivery.enabled}
            onChange={(enabled) => set({ estimatedDelivery: { ...value.estimatedDelivery, enabled } })}
            label="Show estimated delivery dates"
            desc="The product page calculates a date range from the customer's current date"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Minimum days</Label>
              <Input
                type="number"
                min={0}
                max={365}
                value={value.estimatedDelivery.minDays}
                onChange={(event) => set({ estimatedDelivery: { ...value.estimatedDelivery, minDays: Math.max(0, Number(event.target.value) || 0) } })}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum days</Label>
              <Input
                type="number"
                min={0}
                max={365}
                value={value.estimatedDelivery.maxDays}
                onChange={(event) => set({ estimatedDelivery: { ...value.estimatedDelivery, maxDays: Math.max(0, Number(event.target.value) || 0) } })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Product information sections</h2>
          <p className="text-sm text-muted-foreground">Reorder and customize the information shown below the purchase buttons.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addSection} disabled={value.sections.length >= SITE_SETTINGS_LIMITS.MAX_PRODUCT_INFO_SECTIONS}>
          <Plus className="mr-1 h-4 w-4" /> Add section
        </Button>
      </div>

      {value.sections.map((section, index) => (
        <Card key={section.id}>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">{section.title || `Section ${index + 1}`}</CardTitle>
            <div className="flex items-center gap-1">
              <Button type="button" size="icon" variant="ghost" disabled={index === 0} onClick={() => moveSection(index, -1)} aria-label="Move section up"><ArrowUp className="h-4 w-4" /></Button>
              <Button type="button" size="icon" variant="ghost" disabled={index === value.sections.length - 1} onClick={() => moveSection(index, 1)} aria-label="Move section down"><ArrowDown className="h-4 w-4" /></Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => set({ sections: value.sections.filter((_, i) => i !== index) })} aria-label="Remove section"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldToggle id={`product-info-${section.id}`} checked={section.enabled} onChange={(enabled) => updateSection(index, { enabled })} label="Show this section" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Section type</Label>
                <select className={selectCls} value={section.type} onChange={(event) => updateSection(index, { type: event.target.value as ProductInfoType })}>
                  {TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <select className={selectCls} value={section.icon} onChange={(event) => updateSection(index, { icon: event.target.value as ProductInfoIcon })}>
                  {ICONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>
            <TextField label="Title" value={section.title} onChange={(title) => updateSection(index, { title })} maxLength={100} required />
            <TextAreaField label="Content" value={section.content} onChange={(content) => updateSection(index, { content })} rows={4} maxLength={1200} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField label="Link text (optional)" value={section.linkText ?? ""} onChange={(linkText) => updateSection(index, { linkText: linkText || undefined })} maxLength={60} />
              <TextField label="Link URL (optional)" value={section.linkHref ?? ""} onChange={(linkHref) => updateSection(index, { linkHref: linkHref || undefined })} maxLength={500} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
