import React from "react";
import { NavLink } from "react-router-dom";
import { cx } from "@/lib/utils";

type IconFn = (p: React.SVGProps<SVGSVGElement>) => JSX.Element;

const Icon: Record<string, IconFn> = {
  feed:   (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>),
  search: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>),
  inbox:  (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>),
  me:     (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></svg>),
};

interface NavItem {
  to: string;
  label: string;
  icon: IconFn | null;
  end?: boolean;
}

const items: NavItem[] = [
  { to: "/",       label: "FEED",   icon: Icon.feed,   end: true },
  { to: "/search", label: "SEARCH", icon: Icon.search },
  { to: "/drop",   label: "DROP",   icon: null },
  { to: "/inbox",  label: "INBOX",  icon: Icon.inbox },
  { to: "/me",     label: "ME",     icon: Icon.me },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
        {items.map(({ to, label, icon: IconComp, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cx("flex w-16 flex-col items-center gap-1.5 py-1", isActive ? "text-sand" : "text-muted")
            }
          >
            {({ isActive }) =>
              label === "DROP" ? (
                <>
                  <span
                    className={cx(
                      "grid h-11 w-11 place-items-center rounded-full text-2xl leading-none transition-colors",
                      isActive ? "bg-sand text-ink" : "bg-raised text-cream"
                    )}
                  >
                    +
                  </span>
                  <span className="text-[10px] tracking-[0.14em]">{label}</span>
                </>
              ) : IconComp ? (
                <>
                  <IconComp width="22" height="22" />
                  <span className="text-[10px] tracking-[0.14em]">{label}</span>
                </>
              ) : null
            }
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
