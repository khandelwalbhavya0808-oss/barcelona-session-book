type Props = {
  label: string;
  ratio?: string; // e.g. "4/5", "16/9", "1/1"
  className?: string;
};

export function Placeholder({ label, ratio = "4/5", className = "" }: Props) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-md border border-border bg-surface ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(135deg, transparent 49.5%, rgba(255,255,255,0.04) 50%, transparent 50.5%)",
          backgroundSize: "14px 14px",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
