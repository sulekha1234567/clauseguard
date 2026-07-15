import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type Risk = "low" | "medium" | "high";

const CONFIG: Record<
  Risk,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  low: {
    label: "Low risk",
    icon: CheckCircle2,
    className: "bg-risk-low-bg text-risk-low",
  },
  medium: {
    label: "Medium risk",
    icon: AlertTriangle,
    className: "bg-risk-medium-bg text-risk-medium",
  },
  high: {
    label: "High risk",
    icon: ShieldAlert,
    className: "bg-risk-high-bg text-risk-high",
  },
};

/** Accessible, color + icon + text risk indicator (not color-only). */
export function RiskBadge({
  level,
  className,
}: {
  level: Risk;
  className?: string;
}) {
  const { label, icon: Icon, className: tone } = CONFIG[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
