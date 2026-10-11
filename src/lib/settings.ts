// Server-side business settings access (single-row table with defaults).
import { db } from "@/db";
import { businessSettings } from "@/db/schema";
import { DEFAULT_BUSINESS, type BusinessInfo } from "@/lib/business";
import type { SettingsInput } from "@/lib/api";

export type SettingsRow = typeof businessSettings.$inferSelect;

export function rowToBusiness(r: SettingsRow): BusinessInfo {
  return {
    name: r.name,
    tagline: r.tagline,
    addressLines: [r.addressLine1, r.addressLine2].map((s) => s.trim()).filter(Boolean),
    phones: [r.phone1, r.phone2].map((s) => s.trim()).filter(Boolean),
    email: r.email,
    bank: {
      bankName: r.bankName,
      branch: r.bankBranch,
      accountName: r.accountName,
      accountNumber: r.accountNumber,
    },
    invoiceFooter: r.invoiceFooter,
  };
}

export function settingsInputToRow(s: SettingsInput) {
  return {
    name: s.name,
    tagline: s.tagline,
    addressLine1: s.addressLine1,
    addressLine2: s.addressLine2,
    phone1: s.phone1,
    phone2: s.phone2,
    email: s.email,
    bankName: s.bankName,
    bankBranch: s.bankBranch,
    accountName: s.accountName,
    accountNumber: s.accountNumber,
    invoiceFooter: s.invoiceFooter,
  };
}

function defaultRow() {
  return {
    name: DEFAULT_BUSINESS.name,
    tagline: DEFAULT_BUSINESS.tagline,
    addressLine1: "",
    addressLine2: "",
    phone1: "",
    phone2: "",
    email: DEFAULT_BUSINESS.email,
    bankName: "",
    bankBranch: "",
    accountName: DEFAULT_BUSINESS.bank.accountName,
    accountNumber: "",
    invoiceFooter: DEFAULT_BUSINESS.invoiceFooter,
  };
}

/** Reads the shop settings, creating the defaults row on first use. */
export async function getBusinessSettings(): Promise<BusinessInfo> {
  const rows = await db.select().from(businessSettings).limit(1);
  if (rows[0]) return rowToBusiness(rows[0]);
  const [created] = await db.insert(businessSettings).values(defaultRow()).returning();
  return rowToBusiness(created);
}
