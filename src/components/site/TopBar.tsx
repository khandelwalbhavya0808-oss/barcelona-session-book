export function TopBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2 text-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="font-display font-semibold tracking-tight">Alex Moreno</span>
          <span className="hidden text-muted-foreground sm:inline">· S&amp;C Coach · Barcelona</span>
        </a>
        <a
          href="#book"
          className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Book
        </a>
      </div>
    </header>
  );
}
