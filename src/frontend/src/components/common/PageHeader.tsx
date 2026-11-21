import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  className?: string;
}) {
  return (
    <header
      data-ocid="page.header"
      className={cn("mb-5 flex flex-col gap-3 md:mb-6", className)}
    >
      {breadcrumb && (
        <div className="text-xs text-muted-foreground">{breadcrumb}</div>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 md:shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
