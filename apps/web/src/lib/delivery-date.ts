import type { IEstimatedDeliveryConfig } from "../types/site-settings.types";

export function addCalendarDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
}

export function formatDeliveryRange(
  config: IEstimatedDeliveryConfig,
  today = new Date(),
  locale?: string,
): string {
  const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const start = formatter.format(addCalendarDays(today, config.minDays));
  const end = formatter.format(addCalendarDays(today, config.maxDays));
  return start === end ? start : `${start} – ${end}`;
}
