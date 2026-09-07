import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { utilColor } from "@/lib/fleet";
import { statusClasses, statusLabel, levelClasses } from "@/lib/fleet";

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          {title && (
            <h2 className="text-[13px] font-semibold tracking-wide text-foreground">{title}</h2>
          )}
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

const ACCENTS: Record<string, string> = {
  green: "text-teal",
  blue: "text-blue",
  amber: "text-amber",
  red: "text-red",
  gold: "text-gold",
  teal: "text-teal",
  muted: "text-foreground",
};

export function KpiCard({
  label,
  value,
  sub,
  accent = "muted",
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: keyof typeof ACCENTS | string;
  loading?: boolean;
}) {
  return (
    <div className="panel px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {loading ? (
        <div className="skeleton mt-2 h-7 w-20" />
      ) : (
        <p className={cn("num mt-1 text-2xl font-medium", ACCENTS[accent] ?? "text-foreground")}>
          {value}
        </p>
      )}
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function Bar({ pct, color, className }: { pct: number; color?: string; className?: string }) {
  return (
    <div className={cn("h-1 w-full overflow-hidden rounded-sm bg-border", className)}>
      <div
        className="h-full rounded-sm transition-all"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color ?? utilColor(pct) }}
      />
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        statusClasses(status),
      )}
    >
      <span className="size-[5px] rounded-full bg-current" aria-hidden />
      {statusLabel(status)}
    </span>
  );
}

export function LevelBadge({ level }: { level: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
        levelClasses(level),
      )}
    >
      <span className="size-[5px] rounded-full bg-current" aria-hidden />
      {level}
    </span>
  );
}

export function Donut({
  pct,
  size = 128,
  label = "Utilization",
}: {
  pct: number;
  size?: number;
  label?: string;
}) {
  const r = size / 2 - 9;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} role="img" aria-label={`${label} ${pct}%`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth="9"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={utilColor(pct)}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          className="num"
          fontSize={size / 5}
          fill="var(--foreground)"
        >
          {pct}%
        </text>
        <text
          x="50%"
          y="64%"
          textAnchor="middle"
          fontSize="10"
          fill="var(--muted-fg)"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

export function FuelBar({ pct }: { pct: number }) {
  const color = pct < 20 ? "#da3633" : pct < 40 ? "#f0883e" : "#2ea043";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-14 overflow-hidden rounded-sm bg-border">
        <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="num text-[11px] text-muted-foreground">{pct}%</span>
    </div>
  );
}

export function LiveIndicator() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-green-dim/60 px-2.5 py-1 text-[11px] text-teal">
      <span className="live-dot" aria-hidden />
      <span className="num">Live · Updated {secs}s ago</span>
    </span>
  );
}

export function SkeletonTable({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading data">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="skeleton h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 6, height = 92 }: { count?: number; height?: number }) {
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="grid size-10 place-items-center rounded-lg border border-border bg-surface-2 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm text-xs text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-red/40 bg-red-dim/40 p-4">
      <p className="text-sm text-foreground">
        {message ?? "We couldn't load this data. Please try again."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium hover:border-border-hover"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <div className="mb-4">
      {breadcrumb && <div className="mb-2 text-[11px] text-muted-foreground">{breadcrumb}</div>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Pager({
  page,
  pageCount,
  onPage,
  total,
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
  total: number;
}) {
  if (pageCount <= 1) return <p className="num p-3 text-[11px] text-muted-foreground">{total} rows</p>;
  return (
    <div className="flex items-center justify-between border-t border-border px-3 py-2">
      <p className="num text-[11px] text-muted-foreground">
        Page {page} of {pageCount} · {total} rows
      </p>
      <div className="flex gap-1.5">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-md border border-border bg-surface px-2 py-1 text-xs disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={() => onPage(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
          className="rounded-md border border-border bg-surface px-2 py-1 text-xs disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export const btn = {
  primary:
    "inline-flex items-center gap-1.5 rounded-md bg-green-hover px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green disabled:opacity-50",
  secondary:
    "inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-border-hover",
  danger:
    "inline-flex items-center gap-1.5 rounded-md bg-red px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90",
};

export const inputCls =
  "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:border-blue";
