import { BrandMark } from "@/components/layout/BrandMark";
import { NAV_ITEMS } from "@/components/layout/navItems";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  return (
    <aside
      data-ocid="sidebar"
      className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex"
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <BrandMark />
      </div>
      <nav
        aria-label="主导航"
        className="flex-1 space-y-0.5 overflow-y-auto p-2"
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              data-ocid={`nav.${item.to === "/" ? "home" : item.to.slice(1)}.link`}
              className="group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-smooth hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-accent-foreground font-medium before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-primary",
              }}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-4 py-3 text-[11px] leading-relaxed text-sidebar-foreground/50">
        内部档案系统 · 仅限授权成员
      </div>
    </aside>
  );
}

export function MobileTabBar({ isAdmin }: { isAdmin: boolean }) {
  const items = NAV_ITEMS.filter(
    (item) => item.mobile || (item.adminOnly && isAdmin),
  ).slice(0, 5);
  return (
    <nav
      aria-label="底部导航"
      data-ocid="mobile_tab_bar"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card pb-safe lg:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            data-ocid={`mobile_nav.${item.to === "/" ? "home" : item.to.slice(1)}.link`}
            className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] text-muted-foreground transition-smooth"
            activeProps={{ className: "text-primary font-medium" }}
          >
            <Icon className="size-5" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
