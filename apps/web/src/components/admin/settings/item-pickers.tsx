"use client";

import { useCallback } from "react";
import { api } from "@/lib/api";
import type { ICategory, ICollection } from "@/types";
import { OrderedPicker, type PickerItem } from "./ordered-picker";

interface PickerProps {
  ids: string[];
  onChange: (ids: string[]) => void;
}

function categoryToItem(c: ICategory): PickerItem {
  return { _id: c._id, name: c.name, image: c.image ?? null };
}

// ---------- Categories ----------

export function CategoryPicker({ ids, onChange }: PickerProps) {
  const search = useCallback(async (q: string) => {
    const res = await api.get<ICategory[]>(
      `/api/v1/admin/categories?search=${encodeURIComponent(q)}&limit=20`,
    );
    const data = res.success && Array.isArray(res.data) ? res.data : [];
    return data.map(categoryToItem);
  }, []);

  const resolve = useCallback(async (wanted: string[]) => {
    const results = await Promise.all(
      wanted.map(async (id) => {
        const res = await api.get<ICategory>(`/api/v1/admin/categories/${id}`);
        return res.success && res.data ? categoryToItem(res.data) : null;
      }),
    );
    return results.filter((x): x is PickerItem => x !== null);
  }, []);

  return (
    <OrderedPicker
      ids={ids}
      onChange={onChange}
      search={search}
      resolve={resolve}
      searchPlaceholder="Search categories to add…"
      emptyHint="No categories selected — the homepage will auto-show top categories."
      noun="categories"
    />
  );
}

function collectionToItem(c: ICollection): PickerItem {
  return { _id: c._id, name: c.name, image: c.bannerImage || c.image || null };
}

// ---------- Collections ----------

export function CollectionPicker({ ids, onChange }: PickerProps) {
  const search = useCallback(async (q: string) => {
    const res = await api.get<ICollection[]>(
      `/api/v1/admin/collections?search=${encodeURIComponent(q)}&limit=20`,
    );
    const data = res.success && Array.isArray(res.data) ? res.data : [];
    return data.map(collectionToItem);
  }, []);

  const resolve = useCallback(async (wanted: string[]) => {
    const results = await Promise.all(
      wanted.map(async (id) => {
        const res = await api.get<ICollection>(`/api/v1/admin/collections/${id}`);
        return res.success && res.data ? collectionToItem(res.data) : null;
      }),
    );
    return results.filter((x): x is PickerItem => x !== null);
  }, []);

  return (
    <OrderedPicker
      ids={ids}
      onChange={onChange}
      search={search}
      resolve={resolve}
      searchPlaceholder="Search collections to add…"
      emptyHint="No collections selected — the homepage will auto-show featured collections."
      noun="collections"
    />
  );
}

// ---------- Products ----------

interface RawProduct {
  _id: string;
  name: string;
  variantMedia?: Array<{ isCoverGroup?: boolean; media?: Array<{ type: string; url: string }> }>;
}

function productToItem(p: RawProduct): PickerItem {
  const group = p.variantMedia?.find((vm) => vm.isCoverGroup) ?? p.variantMedia?.[0];
  const cover = group?.media?.find((m) => m.type === "image");
  return { _id: p._id, name: p.name, image: cover?.url ?? null };
}

export function ProductPicker({ ids, onChange }: PickerProps) {
  const search = useCallback(async (q: string) => {
    const res = await api.get<RawProduct[]>(
      `/api/v1/admin/products?search=${encodeURIComponent(q)}&limit=10`,
    );
    const data = (res as unknown as { data?: RawProduct[] }).data ?? [];
    return (Array.isArray(data) ? data : []).map(productToItem);
  }, []);

  const resolve = useCallback(async (wanted: string[]) => {
    const results = await Promise.all(
      wanted.map(async (id) => {
        const res = await api.get<RawProduct>(`/api/v1/admin/products/${id}`);
        return res.success && res.data ? productToItem(res.data) : null;
      }),
    );
    return results.filter((x): x is PickerItem => x !== null);
  }, []);

  return (
    <OrderedPicker
      ids={ids}
      onChange={onChange}
      search={search}
      resolve={resolve}
      searchPlaceholder="Search products to add…"
      emptyHint="No products selected — the homepage will auto-show featured products."
      noun="products"
    />
  );
}
