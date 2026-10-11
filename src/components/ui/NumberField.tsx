"use client";

import { useRef, useState, type Ref } from "react";
import { formatMoney } from "@/lib/billing";

type Props = {
  value: number;
  onCommit: (n: number) => void;
  /** "money" shows 2 decimals with thousands separators; "int" shows whole numbers. */
  mode?: "money" | "int";
  min?: number;
  max?: number;
  inputRef?: Ref<HTMLInputElement>;
  id?: string;
  className?: string;
  title?: string;
  disabled?: boolean;
};

/**
 * Text-based numeric input that keeps a local draft while typing and only
 * commits on blur / Enter. Escape cancels the edit.
 */
export function NumberField({
  value,
  onCommit,
  mode = "money",
  min = 0,
  max,
  inputRef,
  id,
  className = "",
  title,
  disabled,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const cancelRef = useRef(false);

  const display = mode === "int" ? String(value) : formatMoney(value);

  const commit = () => {
    setEditing(false);
    if (cancelRef.current) {
      cancelRef.current = false;
      return;
    }
    const cleaned = draft.replace(/[,\s]/g, "");
    if (cleaned === "") return;
    let n = Number(cleaned);
    if (!Number.isFinite(n)) return;
    if (mode === "int") n = Math.floor(n);
    n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    if (mode === "money") n = Math.round(n * 100) / 100;
    onCommit(n);
  };

  return (
    <input
      id={id}
      ref={inputRef}
      type="text"
      inputMode={mode === "int" ? "numeric" : "decimal"}
      disabled={disabled}
      title={title}
      value={editing ? draft : display}
      onFocus={(e) => {
        const el = e.currentTarget;
        setDraft(String(value));
        setEditing(true);
        setTimeout(() => el.select(), 0);
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          cancelRef.current = true;
          e.currentTarget.blur();
        }
      }}
      className={`rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm font-semibold text-zinc-100 tabular-nums transition focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50 ${className}`}
    />
  );
}
