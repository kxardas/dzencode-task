import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { HeaderClock } from "./header-clock";
import { SessionCounter } from "./session-counter";

export function TopMenu() {
  return (
    <header className="top-menu d-flex align-items-center justify-content-between">
      <Link
        className="top-menu__brand d-inline-flex align-items-center gap-2"
        href="/orders"
        aria-label="Inventory — перейти к приходам"
      >
        <ShieldCheck size={36} strokeWidth={1.8} aria-hidden="true" />
        <span>Inventory</span>
      </Link>
      <div className="top-menu__status">
        <HeaderClock />
        <SessionCounter />
      </div>
    </header>
  );
}
