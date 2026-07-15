import { cn } from "@/lib/utils";

/** Horizontal risk meter (0-100). Uses text + position, not color alone. */
export function RiskGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const tone =
    clamped >= 67
      ? "bg-risk-high"
      : clamped >= 34
        ? "bg-risk-medium"
        : "bg-risk-low";

  return (
    <div>
      <div className="flex items-end justify-between">
        <span className="text-sm text-muted-foreground">Overall risk score</span>
        <span className="text-2xl font-bold tabular-nums">{clamped}
          <span className="text-sm font-normal text-muted-foreground">/100</span>
        </span>
      </div>
      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Overall contract risk score"
      >
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>Balanced</span>
        <span>One-sided</span>
      </div>
    </div>
  );
}
