"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  ICategory,
  ICollectionRule,
  CollectionRuleField,
  CollectionRuleOperator,
  CollectionMatchMode,
} from "@/types";

/**
 * Per-field metadata: which operators apply and how the value is entered.
 * `price` values are stored in paise; the UI edits rupees and converts.
 */
const FIELD_CONFIG: Record<
  CollectionRuleField,
  {
    label: string;
    operators: { value: CollectionRuleOperator; label: string }[];
    valueKind: "text" | "rupees" | "number" | "boolean" | "category";
    hint?: string;
  }
> = {
  tag: {
    label: "Tag",
    operators: [
      { value: "eq", label: "is" },
      { value: "ne", label: "is not" },
    ],
    valueKind: "text",
    hint: "Product tag, e.g. festive",
  },
  price: {
    label: "Price (₹)",
    operators: [
      { value: "lte", label: "≤" },
      { value: "lt", label: "<" },
      { value: "gte", label: "≥" },
      { value: "gt", label: ">" },
    ],
    valueKind: "rupees",
    hint: "Amount in ₹",
  },
  category: {
    label: "Category",
    operators: [{ value: "eq", label: "is" }],
    valueKind: "category",
  },
  rating: {
    label: "Rating",
    operators: [{ value: "gte", label: "≥" }],
    valueKind: "number",
    hint: "0–5",
  },
  featured: {
    label: "Featured",
    operators: [{ value: "eq", label: "is" }],
    valueKind: "boolean",
  },
  newerThanDays: {
    label: "Added within",
    operators: [{ value: "gte", label: "last" }],
    valueKind: "number",
    hint: "days",
  },
};

const FIELD_ORDER: CollectionRuleField[] = [
  "tag",
  "price",
  "category",
  "rating",
  "featured",
  "newerThanDays",
];

/** Default operator + value when a field is first chosen. */
function defaultsForField(field: CollectionRuleField): ICollectionRule {
  const cfg = FIELD_CONFIG[field];
  const operator = cfg.operators[0].value;
  let value: string | number | boolean;
  switch (cfg.valueKind) {
    case "boolean":
      value = true;
      break;
    case "rupees":
    case "number":
      value = 0;
      break;
    default:
      value = "";
  }
  return { field, operator, value };
}

/** Convert a stored rule value into what the input should display. */
function toInputValue(rule: ICollectionRule): string {
  if (FIELD_CONFIG[rule.field].valueKind === "rupees") {
    return String(Number(rule.value) / 100);
  }
  return String(rule.value ?? "");
}

interface CollectionRuleBuilderProps {
  rules: ICollectionRule[];
  matchMode: CollectionMatchMode;
  categories: ICategory[];
  onChange: (rules: ICollectionRule[], matchMode: CollectionMatchMode) => void;
}

export function CollectionRuleBuilder({
  rules,
  matchMode,
  categories,
  onChange,
}: CollectionRuleBuilderProps) {
  function updateRule(index: number, patch: Partial<ICollectionRule>) {
    const next = rules.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChange(next, matchMode);
  }

  function changeField(index: number, field: CollectionRuleField) {
    const next = rules.map((r, i) => (i === index ? defaultsForField(field) : r));
    onChange(next, matchMode);
  }

  function setValueFromInput(index: number, raw: string) {
    const rule = rules[index];
    const kind = FIELD_CONFIG[rule.field].valueKind;
    let value: string | number | boolean = raw;
    if (kind === "rupees") value = Math.round((Number(raw) || 0) * 100);
    else if (kind === "number") value = Number(raw) || 0;
    updateRule(index, { value });
  }

  function addRule() {
    onChange([...rules, defaultsForField("tag")], matchMode);
  }

  function removeRule(index: number) {
    onChange(rules.filter((_, i) => i !== index), matchMode);
  }

  return (
    <div className="space-y-4">
      {/* Match mode */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Products matching</span>
        <select
          value={matchMode}
          onChange={(e) => onChange(rules, e.target.value as CollectionMatchMode)}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="all">all</option>
          <option value="any">any</option>
        </select>
        <span className="text-sm text-muted-foreground">of the conditions below</span>
      </div>

      {/* Rules */}
      <div className="space-y-2">
        {rules.length === 0 && (
          <p className="rounded-md border border-dashed border-border/60 py-6 text-center text-sm text-muted-foreground">
            No conditions yet. Add one to define this automated collection.
          </p>
        )}
        {rules.map((rule, index) => {
          const cfg = FIELD_CONFIG[rule.field];
          return (
            <div
              key={index}
              className="flex flex-wrap items-center gap-2 rounded-md border border-border/50 bg-muted/20 p-2"
            >
              {/* Field */}
              <select
                value={rule.field}
                onChange={(e) => changeField(index, e.target.value as CollectionRuleField)}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {FIELD_ORDER.map((f) => (
                  <option key={f} value={f}>
                    {FIELD_CONFIG[f].label}
                  </option>
                ))}
              </select>

              {/* Operator */}
              <select
                value={rule.operator}
                onChange={(e) =>
                  updateRule(index, { operator: e.target.value as CollectionRuleOperator })
                }
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {cfg.operators.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>

              {/* Value */}
              <div className="flex-1 min-w-[140px]">
                {cfg.valueKind === "boolean" ? (
                  <select
                    value={String(rule.value)}
                    onChange={(e) => updateRule(index, { value: e.target.value === "true" })}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : cfg.valueKind === "category" ? (
                  <select
                    value={String(rule.value)}
                    onChange={(e) => updateRule(index, { value: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="">Select category…</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={cfg.valueKind === "text" ? "text" : "number"}
                    value={toInputValue(rule)}
                    placeholder={cfg.hint}
                    onChange={(e) => setValueFromInput(index, e.target.value)}
                    className="h-9"
                  />
                )}
              </div>

              {rule.field === "newerThanDays" ? (
                <span className="text-xs text-muted-foreground">days</span>
              ) : null}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive shrink-0"
                onClick={() => removeRule(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addRule}>
        <Plus className="mr-2 h-4 w-4" />
        Add Condition
      </Button>

      <div className="pt-1">
        <Label className="text-xs text-muted-foreground">
          Automated collections update themselves — any product matching these
          conditions appears automatically.
        </Label>
      </div>
    </div>
  );
}
