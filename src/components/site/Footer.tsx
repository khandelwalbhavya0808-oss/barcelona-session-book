const LINKS = [
  { label: "About", href: "#about" },
  { label: "Schedule", href: "#schedule" },
  { label: "Reviews", href: "#reviews" },
  { label: "Details", href: "#details" },
  { label: "Book", href: "#book" },
];

export function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 border-t border-border px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            <span className="font-display text-base font-semibold tracking-tight">
              Alex Moreno
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Strength &amp; conditioning coaching in Barcelona. Studio and
            outdoor.
          </p>
        </div>

        <div>
          <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Navigate
          </p>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {LINKS.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Contact
          </p>
          <p className="text-sm text-muted-foreground">
            Eixample, Barcelona
            <br />
            Replies within 24h
          </p>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between border-t border-border px-4 py-6 text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:px-6">
        <span>© {new Date().getFullYear()} Alex Moreno</span>
        <span>Barcelona · Spain</span>
      </div>
    </footer>
  );
}
