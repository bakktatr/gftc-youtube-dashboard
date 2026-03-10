"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ── 상수 ────────────────────────────────────────────────────

const EXPANDED_W = 200;
const COLLAPSED_W = 56;

const NAV_ITEMS = [
  {
    href: "/",
    label: "대시보드",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
  },
  {
    href: "/generate",
    label: "콘텐츠 생성기",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  {
    href: "/ad-generate",
    label: "광고 소재",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
  },
];

// ── Context ─────────────────────────────────────────────────

const SidebarContext = createContext({ collapsed: false });
export const useSidebar = () => useContext(SidebarContext);

// ── Component ───────────────────────────────────────────────

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nav-collapsed");
    if (saved === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem("nav-collapsed", String(!prev));
      return !prev;
    });
  };

  const width = collapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      {/* Sidebar */}
      <aside
        style={{ width: mounted ? width : EXPANDED_W }}
        className="fixed top-0 left-0 z-50 h-screen bg-[#0a0a0f]/90 backdrop-blur-xl border-r border-white/[0.06] flex flex-col transition-[width] duration-200 ease-in-out overflow-hidden"
      >
        {/* Logo + Toggle */}
        <div className="flex items-center justify-between h-14 px-3 border-b border-white/[0.06] shrink-0">
          <span
            className="text-[11px] font-bold tracking-widest text-emerald-400/60 uppercase pl-1 transition-opacity duration-200"
            style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
          >
            GFTC
          </span>
          <button
            onClick={toggle}
            className={`p-1.5 rounded-md hover:bg-white/[0.06] text-white/25 hover:text-white/50 transition-colors shrink-0 ${collapsed ? "mx-auto" : ""}`}
            title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              )}
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 p-2 mt-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap overflow-hidden ${
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                } ${
                  isActive
                    ? "text-emerald-300 bg-emerald-500/[0.12]"
                    : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
                }`}
                title={item.label}
              >
                <span className="shrink-0">{item.icon}</span>
                <span
                  className="transition-opacity duration-200"
                  style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content area */}
      <div
        style={{ paddingLeft: mounted ? width : EXPANDED_W }}
        className="transition-[padding-left] duration-200 ease-in-out"
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}
