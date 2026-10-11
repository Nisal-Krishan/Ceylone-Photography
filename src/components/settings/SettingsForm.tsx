"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import type { BusinessInfo } from "@/lib/business";
import { btnPrimary, inputCls, labelCls, panelCls } from "@/lib/ui";

type Form = {
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

const fromBusiness = (b: BusinessInfo): Form => ({
  name: b.name,
  tagline: b.tagline,
  addressLine1: b.addressLines[0] ?? "",
  addressLine2: b.addressLines[1] ?? "",
  phone1: b.phones[0] ?? "",
  phone2: b.phones[1] ?? "",
  email: b.email,
  bankName: b.bank.bankName,
  bankBranch: b.bank.branch,
  accountName: b.bank.accountName,
  accountNumber: b.bank.accountNumber,
  invoiceFooter: b.invoiceFooter,
});

export function SettingsForm() {
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setForm(fromBusiness(d.business)))
      .catch(() => setMsg({ type: "err", text: "Could not load settings" }));
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  const set =
    (key: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => (f ? { ...f, [key]: e.target.value } : f));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form || saving) return;
    if (!form.name.trim()) return setMsg({ type: "err", text: "Shop name is required" });
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save settings");
      setForm(fromBusiness(data.business));
      setMsg({ type: "ok", text: "Settings saved — invoices will use these details" });
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Could not save settings" });
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center text-sm text-zinc-500">Loading settings…</div>
    );
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">SETTINGS</h1>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Shop &amp; invoice details · printed on every invoice
          </p>
        </div>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      <Section title="Shop Details">
        <Field label="Shop Name *">
          <input className={inputCls} value={form.name} maxLength={120} onChange={set("name")} placeholder="CEYLON CAMERA CENTER" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tagline">
            <input className={inputCls} value={form.tagline} maxLength={120} onChange={set("tagline")} placeholder="RENTAL & EQUIPMENT SOLUTIONS" />
          </Field>
          <Field label="Email">
            <input className={inputCls} value={form.email} maxLength={120} onChange={set("email")} placeholder="shop@example.com" />
          </Field>
        </div>
        <Field label="Invoice Footer Note">
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            value={form.invoiceFooter}
            maxLength={500}
            onChange={set("invoiceFooter")}
            placeholder="Thank-you message printed at the bottom of each invoice"
          />
        </Field>
      </Section>

      <Section title="Shop Address">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Address Line 1">
            <input className={inputCls} value={form.addressLine1} maxLength={200} onChange={set("addressLine1")} placeholder="No. 123, Main Street" />
          </Field>
          <Field label="Address Line 2">
            <input className={inputCls} value={form.addressLine2} maxLength={200} onChange={set("addressLine2")} placeholder="Colombo, Sri Lanka" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone 1">
            <input className={inputCls} value={form.phone1} maxLength={40} onChange={set("phone1")} placeholder="011 234 5678" />
          </Field>
          <Field label="Phone 2">
            <input className={inputCls} value={form.phone2} maxLength={40} onChange={set("phone2")} placeholder="077 123 4567" />
          </Field>
        </div>
      </Section>

      <Section title="Bank Transfer Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank Name">
            <input className={inputCls} value={form.bankName} maxLength={120} onChange={set("bankName")} placeholder="e.g. Commercial Bank" />
          </Field>
          <Field label="Branch">
            <input className={inputCls} value={form.bankBranch} maxLength={120} onChange={set("bankBranch")} placeholder="e.g. Colombo 03" />
          </Field>
          <Field label="Account Name">
            <input className={inputCls} value={form.accountName} maxLength={120} onChange={set("accountName")} placeholder="CEYLON CAMERA CENTER" />
          </Field>
          <Field label="Account Number">
            <input className={inputCls} value={form.accountNumber} maxLength={60} onChange={set("accountNumber")} placeholder="e.g. 1234567890" />
          </Field>
        </div>
      </Section>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      {msg && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-3 text-sm font-semibold shadow-2xl ${
            msg.type === "ok"
              ? "border-emerald-500/40 bg-emerald-950 text-emerald-300"
              : "border-red-500/50 bg-red-950 text-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={`${panelCls} space-y-4 p-5`}>
      <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
        <span className="h-2 w-2 rounded-full bg-red-600" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className={labelCls}>{label}</span>
      {children}
    </div>
  );
}
