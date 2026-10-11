"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { SearchIcon } from "@/components/ui/Icons";
import { CATEGORIES, formatMoney, type Category, type ItemDto } from "@/lib/billing";

type Props = {
  items: ItemDto[];
  category: Category | null;
  onCategory: (c: Category | null) => void;
  onPick: (item: ItemDto) => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

const MAX_RESULTS = 80;

export function ItemSearch({ items, category, onCategory, onPick, inputRef }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const pool = category ? items.filter((i) => i.category === category) : items;
    const q = query.trim().toLowerCase();
    if (!q) return pool.slice(0, MAX_RESULTS);

    const tokens = q.split(/\s+/);
    return pool
      .filter((i) => {
        const hay = `${i.name} ${i.description} ${i.category}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
      })
      .map((i) => {
        const name = i.name.toLowerCase();
        // Prefer names that start with the query, then names that contain it.
        const score = (name.startsWith(q) ? 3 : 0) + (name.startsWith(tokens[0]) ? 2 : 0) + (name.includes(q) ? 1 : 0);
        return { i, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map((x) => x.i);
  }, [items, query, category]);

  useEffect(() => {
    setActive(0);
  }, [query, category]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const pick = (item: ItemDto) => {
    onPick(item);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, Math.max(0, results.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (item) pick(item);
    } else if (e.key === "Escape") {
      setQuery("");
      setOpen(false);
    }
  };

  return (
    <div className="relative z-30">
      {/* Search bar */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search item name, model or type… e.g. Sony A7"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className="h-14 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-12 pr-16 text-lg text-zinc-100 placeholder:text-zinc-600 transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-600/40"
        />
        <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 font-mono text-xs text-zinc-400">
          F1
        </kbd>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 text-[11px] uppercase tracking-wider text-zinc-500">
              <span>
                {results.length} {results.length === 1 ? "match" : "matches"}
                {category ? ` in ${category}` : ""}
              </span>
              <span className="hidden sm:inline">↑ ↓ to move · Enter to add · Esc to close</span>
            </div>
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">
                {items.length === 0 ? "Loading items…" : "No items match your search"}
              </div>
            ) : (
              <ul ref={listRef} role="listbox" className="max-h-[360px] overflow-auto py-1">
                {results.map((it, idx) => (
                  <li
                    key={it.id}
                    data-idx={idx}
                    role="option"
                    aria-selected={idx === active}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => pick(it)}
                    className={`flex cursor-pointer items-center gap-4 px-4 py-2.5 transition ${
                      idx === active ? "bg-red-600/15" : "hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className={`truncate font-semibold ${idx === active ? "text-white" : "text-zinc-100"}`}>
                        {it.name}
                      </div>
                      <div className="truncate text-xs text-zinc-500">
                        {it.description || it.category}
                      </div>
                    </div>
                    <span className="hidden rounded-md border border-zinc-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 md:inline">
                      {it.category}
                    </span>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-bold tabular-nums text-white">Rs. {formatMoney(it.defaultRate)}</div>
                      <div className="text-[10px] uppercase tracking-wide text-zinc-500">per day</div>
                    </div>
                    {idx === active && (
                      <kbd className="hidden rounded border border-red-500/60 px-1.5 font-mono text-[10px] text-red-400 sm:inline">
                        ENTER
                      </kbd>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Category quick filters */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onCategory(null);
            setOpen(true);
            inputRef.current?.focus();
          }}
          className={chipCls(category === null)}
        >
          All Items
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onCategory(category === c ? null : c);
              setOpen(true);
              inputRef.current?.focus();
            }}
            className={chipCls(category === c)}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function chipCls(active: boolean) {
  return `rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wider transition sm:text-sm ${
    active
      ? "border-red-500 bg-red-600 text-white shadow-lg shadow-red-900/40"
      : "border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-zinc-500 hover:text-white"
  }`;
}
