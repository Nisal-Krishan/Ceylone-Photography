"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CameraLogo } from "@/components/ui/Icons";

const LINKS = [
  { href: "/", label: "POS Terminal" },
  { href: "/items", label: "Items" },
  { href: "/bills", label: "Saved Bills" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-6 border-b border-zinc-800 bg-zinc-950/95 px-4 backdrop-blur print:hidden">
      <Link href="/" className="flex shrink-0 items-center gap-3">
        <CameraLogo className="h-8 w-8 text-red-600" />
        <span className="text-sm font-black tracking-wide text-white sm:text-base">
          CEYLON <span className="text-red-600">CAMERA</span> CENTER
        </span>
      </Link>

      <nav className="ml-auto flex gap-1 overflow-x-auto">
        {LINKS.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition sm:text-sm ${
                active
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/30"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
