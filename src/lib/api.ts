// Server-side helpers: request validation and response serialization for API routes.
import {
  CATEGORIES,
  PAYMENT_METHODS,
  round2,
  MAX_QTY,
  type Category,
  type ItemDto,
  type PaymentMethod,
} from "@/lib/billing";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

type Obj = Record<string, unknown>;

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 200): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : NaN;
};
const isCategory = (v: unknown): v is Category => CATEGORIES.includes(v as Category);
const isMethod = (v: unknown): v is PaymentMethod => PAYMENT_METHODS.includes(v as PaymentMethod);

// ---------- Serializers ----------

export function serializeItem(row: {
  id: number;
  name: string;
  description: string;
  category: string;
  defaultRate: string;
}): ItemDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category as Category,
    defaultRate: Number(row.defaultRate),
  };
}

export function serializeBill(row: {
  id: number;
  billNo: number;
  customerName: string;
  customerPhone: string;
  customerNic: string;
  customerAddress: string;
  notes: string;
  pickupAt: Date;
  returnAt: Date;
  days: number;
  subtotal: string;
  paid: string;
  balance: string;
  status: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    billNo: row.billNo,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerNic: row.customerNic,
    customerAddress: row.customerAddress,
    notes: row.notes,
    pickupAt: row.pickupAt.toISOString(),
    returnAt: row.returnAt.toISOString(),
    days: row.days,
    subtotal: Number(row.subtotal),
    paid: Number(row.paid),
    balance: Number(row.balance),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

// ---------- Validators ----------

export type ItemInput = {
  name: string;
  description: string;
  category: Category;
  defaultRate: number;
};

export function parseItemBody(body: unknown): Result<ItemInput> {
  if (!isObj(body)) return fail("Invalid request body");
  const name = str(body.name);
  if (!name) return fail("Item name is required");
  if (!isCategory(body.category)) return fail("Please choose a valid category");
  const defaultRate = num(body.defaultRate);
  if (!(defaultRate >= 0)) return fail("Default rate must be a valid amount (0 or more)");
  return {
    ok: true,
    data: {
      name,
      description: str(body.description, 500),
      category: body.category,
      defaultRate: round2(defaultRate),
    },
  };
}

export type BillLineInput = {
  itemId: number | null;
  name: string;
  description: string;
  category: Category;
  defaultRate: number;
  rate: number;
  qty: number;
};

export type BillInput = {
  customerName: string;
  customerNic: string;
  customerPhone: string;
  customerAddress: string;
  pickupAt: Date;
  returnAt: Date;
  notes: string;
  paid: number;
  paymentMethod: PaymentMethod;
  items: BillLineInput[];
};

export function parseBillBody(body: unknown): Result<BillInput> {
  if (!isObj(body)) return fail("Invalid request body");

  const customerName = str(body.customerName);
  if (!customerName) return fail("Customer name is required");
  const customerPhone = str(body.customerPhone, 30);
  if (!customerPhone) return fail("Customer phone number is required");

  const pickupAt = new Date(String(body.pickupAt));
  if (Number.isNaN(pickupAt.getTime())) return fail("Pickup date & time is required");
  const returnAt = new Date(String(body.returnAt));
  if (Number.isNaN(returnAt.getTime())) return fail("Return date & time is required");
  if (returnAt.getTime() < pickupAt.getTime()) return fail("Return must be after the pickup time");

  const paidRaw = num(body.paid);
  const paid = paidRaw > 0 ? round2(paidRaw) : 0;

  const rawItems = Array.isArray(body.items) ? (body.items as unknown[]) : [];
  if (rawItems.length === 0) return fail("Add at least one item to the bill");

  const lines: BillLineInput[] = [];
  for (const raw of rawItems) {
    if (!isObj(raw)) return fail("Invalid cart item");
    const name = str(raw.name);
    if (!name) return fail("Cart item is missing a name");
    const qty = Math.floor(num(raw.qty));
    if (!(qty >= 1 && qty <= MAX_QTY)) return fail(`Invalid quantity for ${name}`);
    const rate = num(raw.rate);
    if (!(rate >= 0)) return fail(`Invalid rate for ${name}`);
    const defaultRate = num(raw.defaultRate);
    lines.push({
      itemId: typeof raw.itemId === "number" && Number.isInteger(raw.itemId) ? raw.itemId : null,
      name,
      description: str(raw.description, 500),
      category: isCategory(raw.category) ? raw.category : "Other",
      defaultRate: defaultRate >= 0 ? round2(defaultRate) : 0,
      rate: round2(rate),
      qty,
    });
  }

  return {
    ok: true,
    data: {
      customerName,
      customerNic: str(body.customerNic, 40),
      customerPhone,
      customerAddress: str(body.customerAddress, 500),
      pickupAt,
      returnAt,
      notes: str(body.notes, 1000),
      paid,
      paymentMethod: isMethod(body.paymentMethod) ? body.paymentMethod : "CASH",
      items: lines,
    },
  };
}

export function parsePaymentBody(body: unknown): Result<{ amount: number; method: PaymentMethod }> {
  if (!isObj(body)) return fail("Invalid request body");
  const amount = round2(num(body.amount));
  if (!(amount > 0)) return fail("Enter a payment amount greater than 0");
  if (!isMethod(body.method)) return fail("Choose a payment method");
  return { ok: true, data: { amount, method: body.method } };
}

export type SettingsInput = {
  name: string;
  tagline: string;
  addressLine1: string;
  addressLine2: string;
  phone1: string;
  phone2: string;
  email: string;
  bankName: string;
  bankBranch: string;
  accountName: string;
  accountNumber: string;
  invoiceFooter: string;
};

export function parseSettingsBody(body: unknown): Result<SettingsInput> {
  if (!isObj(body)) return fail("Invalid request body");
  const name = str(body.name, 120);
  if (!name) return fail("Shop name is required");
  return {
    ok: true,
    data: {
      name,
      tagline: str(body.tagline, 120),
      addressLine1: str(body.addressLine1, 200),
      addressLine2: str(body.addressLine2, 200),
      phone1: str(body.phone1, 40),
      phone2: str(body.phone2, 40),
      email: str(body.email, 120),
      bankName: str(body.bankName, 120),
      bankBranch: str(body.bankBranch, 120),
      accountName: str(body.accountName, 120),
      accountNumber: str(body.accountNumber, 60),
      invoiceFooter: str(body.invoiceFooter, 500),
    },
  };
}
