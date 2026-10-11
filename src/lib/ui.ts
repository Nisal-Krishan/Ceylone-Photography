// Shared Tailwind class presets for the dark POS theme.

export const inputCls =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 transition focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50";

export const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400";

export const panelCls = "rounded-xl border border-zinc-800 bg-zinc-900/70 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-red-900/30 transition hover:bg-red-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50";
