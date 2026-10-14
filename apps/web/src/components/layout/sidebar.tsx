"use client";

import { ClipboardList, Package, PackageOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/orders", label: "Приходы", icon: ClipboardList },
  { href: "/products", label: "Продукты", icon: Package },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar__illustration" aria-hidden="true">
        <PackageOpen size={38} strokeWidth={1.5} />
      </div>
      <nav aria-label="Основная навигация">
        <ul className="sidebar__list list-unstyled mb-0">
          {navigation.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <li key={href}>
                <Link
                  className={`sidebar__link${isActive ? " sidebar__link--active" : ""}`}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
