import type { OpportunityListItem } from "@/backend";
import { DeadlineBadge } from "@/components/opportunities/DeadlineBadge";
import { OpportunityStatusBadge } from "@/components/opportunities/OpportunityStatusBadge";
import { formatDate, formatFen, isRegistrationClosed } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Building2, ChevronRight, Users } from "lucide-react";

/**
 * One announcement in the opportunity pool. Expired registrations keep a
 * visible 已截止 marker but stay fully openable for checking.
 */
export function OpportunityRow({
  item,
  index,
}: {
  item: OpportunityListItem;
  index: number;
}) {
  const closed = isRegistrationClosed(item.registrationDeadline);
  const position = index + 1;

  return (
    <li
      data-ocid={`opportunities.list.item.${position}`}
      className={cn(
        "group relative border-b border-border last:border-b-0 transition-smooth hover:bg-accent/40",
        closed && "bg-status-expired-soft/40",
      )}
    >
      <Link
        to="/opportunities/$opportunityId"
        params={{ opportunityId: item.id.toString() }}
        data-ocid={`opportunities.list.link.${position}`}
        className="flex flex-col gap-2 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex-row md:items-center md:gap-3"
      >
        <span className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md md:size-8",
              closed
                ? "bg-status-expired-soft text-status-expired-foreground"
                : "bg-primary/10 text-primary",
            )}
          >
            <Building2 className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 truncate text-sm font-medium text-foreground">
                {item.projectName}
              </span>
              {closed && (
                <span className="shrink-0 rounded-sm border border-status-expired-border bg-status-expired-soft px-1.5 py-0.5 text-[11px] font-medium text-status-expired-foreground">
                  已截止
                </span>
              )}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="truncate">{item.tenderer}</span>
              <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                {item.projectTypeLabel}
              </span>
            </span>
            <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground md:hidden">
              <span className="num-tabular">
                报名截止 {formatDate(item.registrationDeadline)}
              </span>
              <DeadlineBadge
                daysRemaining={item.daysRemaining}
                registrationDeadline={item.registrationDeadline}
              />
              <span className="num-tabular">
                预算 {formatFen(item.budgetYuan)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="size-3" aria-hidden="true" />
                已核对 {item.checkedCompanyCount.toString()} 家
              </span>
            </span>
          </span>
        </span>

        <span className="hidden w-32 shrink-0 text-xs text-muted-foreground md:block">
          <span className="block num-tabular text-foreground">
            {formatDate(item.registrationDeadline)}
          </span>
          <span className="mt-1 block">
            <DeadlineBadge
              daysRemaining={item.daysRemaining}
              registrationDeadline={item.registrationDeadline}
            />
          </span>
        </span>
        <span className="hidden w-28 shrink-0 text-right text-sm num-tabular text-foreground md:block">
          {formatFen(item.budgetYuan)}
        </span>
        <span className="hidden w-24 shrink-0 md:block">
          <OpportunityStatusBadge status={item.status} />
        </span>
        <span className="hidden w-20 shrink-0 items-center justify-end gap-1 text-xs text-muted-foreground md:flex">
          <Users className="size-3" aria-hidden="true" />
          {item.checkedCompanyCount.toString()} 家
        </span>
        <span className="flex items-center justify-between gap-2 md:hidden">
          <OpportunityStatusBadge status={item.status} />
          <ChevronRight
            className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
        <ChevronRight
          className="hidden size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 md:block"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}
