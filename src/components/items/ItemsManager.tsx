"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { PencilIcon, PlusIcon, SearchIcon, TrashIcon, XIcon } from "@/components/ui/Icons";
import { CATEGORIES, formatMoney, type Category, type ItemDto } from "@/lib/billing";
import { btnGhost, btnPrimary, inputCls, labelCls, panelCls } from "@/lib/ui";

type FormState = {
  name: string;
  description: string;
  category: Category;
  defaultRate: string;
};

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  category: "Cameras",
  defaultRate: "",
});

type ModalState = { mode: "add" } | { mode: "edit"; item: ItemDto } | null;

export function ItemsManager() {
  const [items, setItems] = useState<ItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const flash = useCallback((type: "ok" | "err", text: string) => setToast({ type, text }), []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/items", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      flash("err", "Could not load items");
    } finally {
      setLoading(false);
    }
  }, [flash]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = useMemo(() => {
    const map = new Map<Category, number>();
    for (const c of CATEGORIES) map.set(c, 0);
    for (const i of items) map.set(i.category, (map.get(i.category) ?? 0) + 1);
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((i) => {
      if (category && i.category !== category) return false;
      const hay = `${i.name} ${i.description} ${i.category}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [items, query, category]);

  const openAdd = () => {
    setForm(emptyForm());
    setFormError("");
    setModal({ mode: "add" });
  };

  const openEdit = (item: ItemDto) => {
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      defaultRate: String(item.defaultRate),
    });
    setFormError("");
    setModal({ mode: "edit", item });
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim()) return setFormError("Item name is required");
    const rate = Number(form.defaultRate);
    if (form.defaultRate.trim() === "" || !Number.isFinite(rate) || rate < 0) {
      return setFormError("Enter a valid default rental rate (0 or more)");
    }

    const isEdit = modal?.mode === "edit";
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/items/${modal.item.id}` : "/api/items", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          defaultRate: rate,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save the item");
      setModal(null);
      flash("ok", isEdit ? "Item updated" : "New item added");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the item");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: ItemDto) => {
    if (!window.confirm(`Delete "${item.name}" permanently?\n\nPast bills keep their own record of this item.`)) return;
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not delete the item");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      flash("ok", "Item deleted");
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Could not delete the item");
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">INVENTORY &amp; ITEMS</h1>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Admin control · {items.length} items in catalogue
          </p>
        </div>
        <button type="button" onClick={openAdd} className={btnPrimary}>
          <PlusIcon className="h-4 w-4" />
          Add New Item
        </button>
      </div>

      {/* Filters */}
      <div className={`${panelCls} flex flex-col gap-4 p-4`}>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            className={`${inputCls} py-2.5 pl-10`}
            placeholder="Search by name or description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setCategory(null)} className={chip(category === null)}>
            All ({items.length})
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(category === c ? null : c)} className={chip(category === c)}>
              {c} ({counts.get(c) ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={`${panelCls} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-zinc-900 text-[11px] uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="border-b border-zinc-800 px-4 py-3 text-left font-semibold">#</th>
                <th className="border-b border-zinc-800 px-4 py-3 text-left font-semibold">Item Name</th>
                <th className="border-b border-zinc-800 px-4 py-3 text-left font-semibold">Description / Specs</th>
                <th className="border-b border-zinc-800 px-4 py-3 text-left font-semibold">Category</th>
                <th className="border-b border-zinc-800 px-4 py-3 text-right font-semibold">Default Rate (Rs./day)</th>
                <th className="border-b border-zinc-800 px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    Loading items…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    No items found. Try a different search or add a new item.
                  </td>
                </tr>
              )}
              {filtered.map((item, idx) => (
                <tr key={item.id} className="transition hover:bg-zinc-800/40">
                  <td className="border-b border-zinc-800/70 px-4 py-3 text-zinc-500">{idx + 1}</td>
                  <td className="border-b border-zinc-800/70 px-4 py-3 font-semibold text-zinc-100">{item.name}</td>
                  <td className="border-b border-zinc-800/70 px-4 py-3 text-zinc-400">
                    {item.description || <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="border-b border-zinc-800/70 px-4 py-3">
                    <span className="rounded-md border border-zinc-700 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
                      {item.category}
                    </span>
                  </td>
                  <td className="border-b border-zinc-800/70 px-4 py-3 text-right font-bold tabular-nums text-white">
                    {formatMoney(item.defaultRate)}
                  </td>
                  <td className="border-b border-zinc-800/70 px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-red-500 hover:text-white"
                      >
                        <PencilIcon className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item)}
                        aria-label={`Delete ${item.name}`}
                        className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-zinc-400 transition hover:border-red-600 hover:bg-red-600/15 hover:text-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => setModal(null)}>
          <form
            onSubmit={submit}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div>
                <h2 className="text-base font-black uppercase tracking-wide text-white">
                  {modal.mode === "add" ? "Add New Item" : "Edit Item"}
                </h2>
                <p className="text-xs text-zinc-500">
                  {modal.mode === "add" ? "Create a new rentable product" : "Changes update the default price for future bills"}
                </p>
              </div>
              <button type="button" onClick={() => setModal(null)} aria-label="Close" className="text-zinc-500 hover:text-white">
                <XIcon />
              </button>
            </div>

            <div className="grid gap-4 p-6">
              <div>
                <label htmlFor="f-name" className={labelCls}>
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="f-name"
                  autoFocus
                  className={inputCls}
                  placeholder="e.g. SONY A7 III + BATTERY"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="f-cat" className={labelCls}>
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="f-cat"
                    className={inputCls}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="f-rate" className={labelCls}>
                    Default Rental Rate (Rs./day) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="f-rate"
                    inputMode="decimal"
                    className={`${inputCls} text-right tabular-nums`}
                    placeholder="0.00"
                    value={form.defaultRate}
                    onChange={(e) => setForm({ ...form, defaultRate: e.target.value.replace(/[^0-9.]/g, "") })}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="f-desc" className={labelCls}>
                  Description / Specs <span className="text-zinc-600">(optional)</span>
                </label>
                <textarea
                  id="f-desc"
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder="e.g. Mirrorless body, 24MP, includes 1 battery"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {formError && (
                <p className="rounded-lg border border-red-500/40 bg-red-950/60 px-3 py-2 text-sm text-red-300">{formError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-800 px-6 py-4">
              <button type="button" onClick={() => setModal(null)} className={btnGhost}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Saving…" : modal.mode === "add" ? "Add Item" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-3 text-sm font-semibold shadow-2xl ${
            toast.type === "ok"
              ? "border-emerald-500/40 bg-emerald-950 text-emerald-300"
              : "border-red-500/50 bg-red-950 text-red-200"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

function chip(active: boolean) {
  return `rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition ${
    active
      ? "border-red-500 bg-red-600 text-white"
      : "border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-zinc-500 hover:text-white"
  }`;
}
