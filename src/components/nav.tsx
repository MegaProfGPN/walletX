"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/" as const, label: "Ringkasan", icon: "◧" },
  { href: "/transaksi" as const, label: "Transaksi", icon: "≡" },
  { href: "/transaksi/baru" as const, label: "Catat", icon: "+" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-surface md:hidden"
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
              active ? "text-brand-600" : "text-muted"
            }`}
          >
            <span aria-hidden className="text-lg leading-none">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SideNav({
  name,
  onSignOut,
}: {
  name: string;
  onSignOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-56 shrink-0 border-r border-line bg-surface p-4 md:flex md:flex-col">
      <span className="px-2 text-lg font-semibold text-brand-700">Catatan Uang</span>
      <p className="mt-1 px-2 text-sm text-muted">Halo, {name}</p>
      <nav aria-label="Navigasi utama" className="mt-6 flex flex-col gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm ${
                active ? "bg-brand-50 font-medium text-brand-700" : "text-ink hover:bg-canvas"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <form action={onSignOut} className="mt-auto">
        <button
          type="submit"
          className="min-h-11 w-full rounded-lg px-3 text-left text-sm text-muted hover:bg-canvas"
        >
          Keluar
        </button>
      </form>
    </aside>
  );
}
