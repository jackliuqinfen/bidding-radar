import type { GapCounts } from "@/backend";
import { COUNT_META, countValue } from "@/components/dashboard/gapCounts";
import { cn } from "@/lib/utils";

/** Five compact count chips; zero counts stay visible but muted so gaps read at a glance. */
export function CountChips({
  counts,
  className,
}: {
  counts: GapCounts;
  className?: string;
}) {
  return (
    <dl className={cn("grid grid-cols-5 gap-1.5 sm:gap-2", className)}>
      {COUNT_META.map((meta) => {
        const value = countValue(counts, meta.key);
        const zero = value === 0n;
        return (
          <div
            key={meta.key}
            data-ocid={`dashboard.count.${meta.key}`}
            className={cn(
              "flex min-w-0 flex-col items-center gap-0.5 rounded-md border px-1 py-1.5 text-center",
              zero
                ? "border-border bg-muted/40 text-muted-foreground"
                : meta.chip,
            )}
          >
            <dt className="flex items-center gap-1 text-[11px] leading-tight">
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  zero ? "bg-muted-foreground/40" : meta.dot,
                )}
              />
              <span className="truncate">{meta.label}</span>
            </dt>
            <dd
              className={cn(
                "num-tabular font-display text-base font-semibold leading-none",
                zero && "text-muted-foreground/70",
              )}
            >
              {value.toString()}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
