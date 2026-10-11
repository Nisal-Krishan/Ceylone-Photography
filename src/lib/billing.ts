// Shared (client + server) billing constants and pure helpers.

export const CATEGORIES = ["Cameras", "Lenses", "Batteries & Chargers", "Accessories", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];

export const PAYMENT_METHODS = ["CASH", "TRANSFER", "CARD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  TRANSFER: "Bank Transfer",
  CARD: "Card",
};

/** First invoice number issued when the system has no bills yet. */
export const FIRST_BILL_NO = 1000;
export const MAX_QTY = 999;
export const CURRENCY = "Rs.";

export type ItemDto = {
  id: number;
  name: string;
  description: string;
  category: Category;
  defaultRate: number;
};

export type CartLine = {
  uid: string;
  itemId: number | null;
  name: string;
  description: string;
  category: Category;
  defaultRate: number;
  /** Rate applied on this bill (editable per line). */
  rate: number;
  qty: number;
};

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Rental days between pickup and return. Any started day counts; minimum 1 day. */
export function calcDays(pickup: Date, ret: Date): number {
  const ms = ret.getTime() - pickup.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 1;
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

export function lineTotal(qty: number, rate: number, days: number): number {
  return round2(qty * rate * days);
}

export function paymentStatus(total: number, paid: number): "PAID" | "PARTIAL" | "UNPAID" {
  const balance = round2(total - paid);
  if (balance <= 0) return "PAID";
  if (paid > 0) return "PARTIAL";
  return "UNPAID";
}

export function formatMoney(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Value for <input type="datetime-local"> in the user's local time. */
export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Colombo",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const DATE_ONLY_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Colombo",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDateTime(value: Date | string): string {
  return DATE_FMT.format(new Date(value));
}

export function formatDateOnly(value: Date | string): string {
  return DATE_ONLY_FMT.format(new Date(value));
}
