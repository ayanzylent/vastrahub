"use client";

const GUEST_ID_KEY = "vastrahub_guest_id";

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
