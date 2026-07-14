"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SITE_SETTINGS_LIMITS, PRODUCT_PAGE_BADGE_FIELDS } from "@/constants";
import type {
  IProductInfoBlock,
  IProductPageConfig,
} from "@/types";
import { FieldToggle } from "./field-toggle";
import { TextAreaField, TextField } from "./fields";

const BADGE_FIELDS = PRODUCT_PAGE_BADGE_FIELDS;

const INFO_BLOCKS: Array<{
  key: "returnAndExchange" | "shippingInformation" | "sellerInformation";
  title: string;
  desc: string;
}> = [
  {
    key: "returnAndExchange",
    title: "Return and exchange",
    desc: "Optional policy text and link shown in the product page accordion",
  },
  {
    key: "shippingInformation",
    title: "Shipping information",
    desc: "Optional shipping details and link shown in the product page accordion",
  },
  {
    key: "sellerInformation",
    title: "Seller information",
    desc: "Optional seller details and link shown in the product page accordion",
  },
];

function InfoBlockFields({
  title,
  desc,
  value,
  onChange,
}: {
  title: string;
  desc: string;
  value: IProductInfoBlock;
  onChange: (value: IProductInfoBlock) => void;
}) {
  const set = (patch: Partial<IProductInfoBlock>) => onChange({ ...value, ...patch });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <TextAreaField
          label="Content (optional)"
          value={value.content ?? ""}
          onChange={(content) => set({ content: content || undefined })}
          rows={4}
          maxLength={SITE_SETTINGS_LIMITS.MAX_PRODUCT_INFO_CONTENT}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label="Link text (optional)"
            value={value.linkText ?? ""}
            onChange={(linkText) => set({ linkText: linkText || undefined })}
            maxLength={SITE_SETTINGS_LIMITS.MAX_PRODUCT_INFO_LINK_TEXT}
          />
          <TextField
            label="Link URL (optional)"
            value={value.linkHref ?? ""}
            onChange={(linkHref) => set({ linkHref: linkHref || undefined })}
            maxLength={SITE_SETTINGS_LIMITS.MAX_PRODUCT_INFO_LINK_HREF}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductPageEditor({
  value,
  onChange,
}: {
  value: IProductPageConfig;
  onChange: (value: IProductPageConfig) => void;
}) {
  const set = (patch: Partial<IProductPageConfig>) => onChange({ ...value, ...patch });

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
                onChange={(event) => set({
                  estimatedDelivery: {
                    ...value.estimatedDelivery,
                    minDays: Math.min(365, Math.max(0, Number(event.target.value) || 0)),
                  },
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum days</Label>
              <Input
                type="number"
                min={0}
                max={365}
                value={value.estimatedDelivery.maxDays}
                onChange={(event) => set({
                  estimatedDelivery: {
                    ...value.estimatedDelivery,
                    maxDays: Math.min(365, Math.max(0, Number(event.target.value) || 0)),
                  },
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trust badges</CardTitle>
          <p className="text-sm text-muted-foreground">
            Toggle which badges appear under delivery on the product page
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {BADGE_FIELDS.map((field) => (
            <FieldToggle
              key={field.key}
              id={`product-badge-${field.key}`}
              checked={value.badges[field.key]}
              onChange={(checked) => set({ badges: { ...value.badges, [field.key]: checked } })}
              label={field.label}
              desc={field.desc}
            />
          ))}
        </CardContent>
      </Card>

      {INFO_BLOCKS.map((block) => (
        <InfoBlockFields
          key={block.key}
          title={block.title}
          desc={block.desc}
          value={value[block.key]}
          onChange={(next) => set({ [block.key]: next })}
        />
      ))}
    </div>
  );
}
