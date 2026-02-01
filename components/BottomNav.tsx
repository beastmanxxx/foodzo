"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BOTTOM_NAV_ITEMS } from "@/lib/navigation";

const isActivePath = (pathname: string, href: string | undefined) => {
  if (!href) {
    return false;
  }

  if (href === "/home") {
    return pathname === "/home" || pathname === "/";
  }

  return pathname.startsWith(href);
};

const baseItemClasses =
  "flex flex-col items-center text-xs font-semibold transition";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] px-6 pb-6">
      <div className="flex items-center justify-between rounded-[26px] bg-white/80 px-6 py-4 shadow-[0_24px_54px_rgba(215,120,10,0.18)] backdrop-blur-xl">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = isActivePath(pathname, item.href);
          const className = `${baseItemClasses} ${
            isActive ? "text-[#c77408]" : "text-[#b7925f]"
          }`;

          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className={className}>
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              className={`${className} cursor-default opacity-60`}
              disabled
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
