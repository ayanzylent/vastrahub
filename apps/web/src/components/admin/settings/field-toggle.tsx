"use client";

/** Small labelled toggle switch, matching the collection-form styling. */
export function FieldToggle({
  id,
  checked,
  onChange,
  label,
  desc,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-background rounded-full shadow transition-transform peer-checked:translate-x-4" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc ? <p className="text-xs text-muted-foreground">{desc}</p> : null}
      </div>
    </label>
  );
}
