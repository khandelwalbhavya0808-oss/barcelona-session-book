export function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-10 text-xs uppercase tracking-wider text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Alex Moreno · S&amp;C Coach
        </div>
        <div>Barcelona, Spain</div>
        <div>© {new Date().getFullYear()}</div>
      </div>
    </footer>
  );
}
