"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ICta } from "@/types";

export const textareaCls =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y";
export const selectCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={textareaCls}
      />
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              value === o.value
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border/50 text-muted-foreground hover:bg-muted/30"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Edits an optional CTA. Empty label AND href => undefined. */
export function CtaFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ICta | undefined;
  onChange: (v: ICta | undefined) => void;
}) {
  const cta = value ?? { label: "", href: "" };
  function update(patch: Partial<ICta>) {
    const next = { ...cta, ...patch };
    onChange(next.label.trim() === "" && next.href.trim() === "" ? undefined : next);
  }
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input
          value={cta.label}
          onChange={(e) => update({ label: e.target.value })}
          placeholder="Button text"
          maxLength={60}
        />
        <Input
          value={cta.href}
          onChange={(e) => update({ href: e.target.value })}
          placeholder="/path or https://…"
          maxLength={500}
        />
      </div>
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</p>
  );
}
