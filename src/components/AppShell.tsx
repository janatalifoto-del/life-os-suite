import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Flame,
  Target,
  CalendarDays,
  Wallet,
  Brain,
  Compass,
  NotebookPen,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/os-store";

const NAV = [
  { to: "/", label: "Dopamin & Denní mise", icon: Flame },
  { to: "/plan-12", label: "12týdenní rok", icon: Target },
  { to: "/kalendar", label: "Plánovač & Kalendář", icon: CalendarDays },
  { to: "/finance", label: "Finanční hub", icon: Wallet },
  { to: "/druha-hlava", label: "Druhá hlava", icon: Brain },
  { to: "/pilire", label: "Životní pilíře", icon: Compass },
  { to: "/denik", label: "Deník & Reset", icon: NotebookPen },
] as const;

function Celebration() {
  const { celebration } = useStore();
  if (!celebration) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center">
      <div className="celebrate-toast flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg">
        <Sparkles className="size-4" />
        {celebration}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [dark, setDark] = React.useState(true);
  const path = useRouterState({ select: (s) => s.location.pathname });

  React.useEffect(() => {
    const stored = localStorage.getItem("zivot-os-theme");
    setDark(stored ? stored === "dark" : true);
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("zivot-os-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Celebration />
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface/70 p-3 backdrop-blur transition-all md:flex",
          collapsed ? "w-[74px]" : "w-[268px]",
        )}
      >
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary font-display text-base font-bold text-primary-foreground">
            Ž
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold leading-tight">Život OS</div>
              <div className="truncate text-xs text-muted-foreground">Druhá hlava</div>
            </div>
          )}
        </div>

        <nav className="mt-3 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = path === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary/15 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 border-t border-border pt-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
          >
            {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed && "Sbalit menu"}
          </button>
          <button
            onClick={() => setDark((v) => !v)}
            aria-label="Přepnout režim"
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center gap-2 overflow-x-auto border-b border-border bg-background/85 px-3 py-2 backdrop-blur md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs",
                path === item.to ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <item.icon className="size-3.5" />
              {item.label.split(" ")[0]}
            </Link>
          ))}
        </header>
        <main className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
