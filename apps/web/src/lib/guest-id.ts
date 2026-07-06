"use client";

import { BRAND_CONFIG } from "@vastrahub/shared-constants";

const GUEST_ID_KEY = BRAND_CONFIG.GUEST_ID_KEY;

function generateUUID(): string {
  return crypto.randomUUID();
}

export function getGuestId(): string {
  if (typeof window === "undefined") return "";
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = generateUUID();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

export function clearGuestId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_ID_KEY);
}
