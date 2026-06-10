import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { label: "About", href: "#about" },
  { label: "Schedule", href: "#schedule" },
  { label: "Reviews", href: "#reviews" },
  { label: "Details", href: "#details" },
  { label: "Reschedule", href: "#book" },
];

export function TopBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5 text-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="font-display text-[15px] font-semibold tracking-tight">
            Alex Moreno
          </span>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-muted-foreground md:inline">
            · S&amp;C Coach
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-[13px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#book"
            className="hidden h-9 items-center rounded-sm bg-accent px-5 text-[13px] font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90 sm:inline-flex"
          >
            Book
          </a>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border text-foreground md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-border/60 py-3 text-sm uppercase tracking-[0.14em] text-muted-foreground last:border-0 hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#book"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex h-10 items-center justify-center rounded-sm bg-accent px-5 text-sm font-semibold uppercase tracking-wider text-accent-foreground"
            >
              Book a Session
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
