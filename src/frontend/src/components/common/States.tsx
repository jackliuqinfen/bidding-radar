import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertTriangle, Inbox, Loader2, RotateCw } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-ocid="empty_state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/60 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="size-5" aria-hidden="true" />}
      </div>
      <div className="space-y-1">
        <p className="font-display text-sm font-semibold text-foreground">
          {title}
        </p>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({
  label = "正在加载…",
  rows = 3,
  className,
}: {
  label?: string;
  rows?: number;
  className?: string;
}) {
  const ids = Array.from({ length: rows }, (_, i) => `skeleton-${i}`);
  return (
    <div
      data-ocid="loading_state"
      aria-busy="true"
      aria-live="polite"
      className={cn("space-y-3", className)}
    >
      <span className="sr-only">{label}</span>
      {ids.map((id) => (
        <div
          key={id}
          className="rounded-lg border border-border bg-card p-4 shadow-subtle"
        >
          <Skeleton className="mb-3 h-4 w-1/3" />
          <Skeleton className="mb-2 h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function InlineLoading({ label = "正在加载…" }: { label?: string }) {
  return (
    <div
      data-ocid="loading_state"
      className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      data-ocid="error_state"
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm",
        className,
      )}
    >
      <div className="flex items-start gap-2 text-destructive">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p className="text-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-ocid="error_state.retry_button"
          onClick={onRetry}
        >
          <RotateCw className="size-3.5" aria-hidden="true" />
          重试
        </Button>
      )}
    </div>
  );
}
