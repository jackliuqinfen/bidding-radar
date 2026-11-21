import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** A titled block on the role home with a consistent header and body rhythm. */
export function HomeSection({
  title,
  description,
  icon: Icon,
  count,
  action,
  children,
  className,
  ocid,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  ocid: string;
}) {
  return (
    <section
      data-ocid={ocid}
      aria-labelledby={`${ocid}-title`}
      className={cn(
        "flex flex-col rounded-lg border border-border bg-card shadow-subtle",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3 md:px-5">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2
              id={`${ocid}-title`}
              className="flex items-center gap-2 font-display text-sm font-semibold text-foreground"
            >
              {title}
              {count !== undefined && count > 0 && (
                <span className="num-tabular rounded-sm bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                  {count}
                </span>
              )}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="flex-1 p-3 md:p-4">{children}</div>
    </section>
  );
}
