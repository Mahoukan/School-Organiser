"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigationItems } from "./navigationItems";

function NavigationLinks({ mobile = false }) {
  const pathname = usePathname();

  return (
    <ul className={mobile ? "mobile-nav__list" : "sidebar-nav__list"}>
      {navigationItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(`${item.href}/`));

        return (
          <li key={item.href}>
            <Link
              className={mobile ? "mobile-nav__link" : "sidebar-nav__link"}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function AppNavigation() {
  return (
    <>
      <aside className="desktop-sidebar">
        <div className="sidebar-brand">School Organiser</div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          <NavigationLinks />
        </nav>
      </aside>

      <header className="mobile-header">
        <p className="mobile-header__brand">School Organiser</p>
      </header>

      <nav className="mobile-nav" aria-label="Primary navigation">
        <NavigationLinks mobile />
      </nav>
    </>
  );
}
