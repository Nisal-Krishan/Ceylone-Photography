import {
  integer,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/** Rental inventory: every rentable camera, lens, battery, accessory, etc. */
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(),
  /** Default rental rate per day (LKR). */
  defaultRate: numeric("default_rate", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per invoice / bill. */
export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  billNo: integer("bill_no").notNull().unique(),
  customerName: text("customer_name").notNull().default(""),
  customerNic: text("customer_nic").notNull().default(""),
  customerPhone: text("customer_phone").notNull().default(""),
  customerAddress: text("customer_address").notNull().default(""),
  pickupAt: timestamp("pickup_at", { withTimezone: true }).notNull(),
  returnAt: timestamp("return_at", { withTimezone: true }).notNull(),
  days: integer("days").notNull().default(1),
  notes: text("notes").notNull().default(""),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  paid: numeric("paid", { precision: 12, scale: 2 }).notNull().default("0"),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  /** PAID | PARTIAL | UNPAID */
  status: text("status").notNull().default("UNPAID"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Snapshot of each cart line at the time the bill was saved (custom rate kept). */
export const billItems = pgTable("bill_items", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id")
    .notNull()
    .references(() => bills.id, { onDelete: "cascade" }),
  itemId: integer("item_id").references(() => items.id, { onDelete: "set null" }),
  itemName: text("item_name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(),
  qty: integer("qty").notNull().default(1),
  defaultRate: numeric("default_rate", { precision: 12, scale: 2 }).notNull().default("0"),
  /** Rate actually applied on this bill (may be a custom price). */
  rate: numeric("rate", { precision: 12, scale: 2 }).notNull().default("0"),
  days: integer("days").notNull().default(1),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull().default("0"),
});

/** Payment history per bill (advance, balance, etc.). */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id")
    .notNull()
    .references(() => bills.id, { onDelete: "cascade" }),
  /** CASH | TRANSFER | CARD */
  method: text("method").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Shop details printed on invoices. Single row, edited from the Settings page. */
export const businessSettings = pgTable("business_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("CEYLON CAMERA CENTER"),
  tagline: text("tagline").notNull().default("RENTAL & EQUIPMENT SOLUTIONS"),
  addressLine1: text("address_line1").notNull().default(""),
  addressLine2: text("address_line2").notNull().default(""),
  phone1: text("phone1").notNull().default(""),
  phone2: text("phone2").notNull().default(""),
  email: text("email").notNull().default(""),
  bankName: text("bank_name").notNull().default(""),
  bankBranch: text("bank_branch").notNull().default(""),
  accountName: text("account_name").notNull().default("CEYLON CAMERA CENTER"),
  accountNumber: text("account_number").notNull().default(""),
  invoiceFooter: text("invoice_footer").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Tiny key/value table used for one-time bootstrap flags. */
export const appSettings = pgTable(
  "app_settings",
  {
    key: text("key").notNull(),
    value: text("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.key] })],
);
