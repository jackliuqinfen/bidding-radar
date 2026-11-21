import type { CheckItemView, OpportunityListItem } from "@/backend";
import { CheckConclusion } from "@/backend";
import { EmptyState, InlineLoading } from "@/components/common/States";
import { DeadlineBadge } from "@/components/opportunities/DeadlineBadge";
import { OpportunityStatusBadge } from "@/components/opportunities/OpportunityStatusBadge";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { CHECK_CONCLUSION_LABELS } from "@/lib/labels";
import { opportunitySearch } from "@/lib/opportunitySearch";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ChevronRight, CircleHelp, Target } from "lucide-react";

const CONCLUSION_STYLES: Record<CheckConclusion, string> = {
  [CheckConclusion.conform]:
    "bg-status-verified-soft text-status-verified-foreground border-status-verified-border",
  [CheckConclusion.pending]:
    "bg-status-pending-soft text-status-pending-foreground border-status-pending-border",
  [CheckConclusion.nonConform]:
    "bg-status-expired-soft text-status-expired-foreground border-status-expired-border",
};

function TodoRow({
  to,
  params,
  ocid,
  children,
}: {
  to: "/opportunities/$opportunityId";
  params: { opportunityId: string };
  ocid: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        to={to}
        params={params}
        data-ocid={ocid}
        className="group flex items-start gap-3 rounded-md px-2 py-2.5 transition-smooth hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <div className="min-w-0 flex-1">{children}</div>
        <ChevronRight
          className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

function ClosingSoonRow({
  item,
  index,
}: {
  item: OpportunityListItem;
  index: number;
}) {
  return (
    <TodoRow
      to="/opportunities/$opportunityId"
      params={{ opportunityId: item.id.toString() }}
      ocid={`home.opportunity_todo.closing.${index}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="min-w-0 truncate text-sm font-medium text-foreground">
          {item.projectName}
        </span>
        <DeadlineBadge
          daysRemaining={item.daysRemaining}
          registrationDeadline={item.registrationDeadline}
        />
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {item.tenderer} · {item.projectTypeLabel} · 报名截止{" "}
        {formatDate(item.registrationDeadline)}
      </p>
    </TodoRow>
  );
}

function PendingConfirmationRow({
  item,
  index,
}: {
  item: CheckItemView;
  index: number;
}) {
  return (
    <TodoRow
      to="/opportunities/$opportunityId"
      params={{ opportunityId: item.opportunityId.toString() }}
      ocid={`home.opportunity_todo.pending.${index}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="min-w-0 truncate text-sm font-medium text-foreground">
          {item.companyName}
        </span>
        <Badge
          variant="outline"
          className={cn(
            "rounded-sm px-1.5 py-0.5 font-medium",
            CONCLUSION_STYLES[item.conclusion],
          )}
        >
          {CHECK_CONCLUSION_LABELS[item.conclusion]}
        </Badge>
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {item.kindLabel} · 由 {item.createdByName} 提交，待确认
      </p>
    </TodoRow>
  );
}

/**
 * 机会池待办: announcements closing within 7 days and check conclusions still
 * awaiting confirmation. Each row links straight to the announcement detail.
 */
export function OpportunityTodo({
  closingSoon,
  pendingConfirmations,
  isLoading,
}: {
  closingSoon: OpportunityListItem[];
  pendingConfirmations: CheckItemView[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return <InlineLoading label="正在加载机会池待办…" />;
  }

  if (closingSoon.length === 0 && pendingConfirmations.length === 0) {
    return (
      <EmptyState
        icon={<Target className="size-5" aria-hidden="true" />}
        title="暂无机会池待办"
        description="7 天内截止的公告与待确认的核对结论会出现在这里。"
        className="border-0 bg-transparent py-8"
      />
    );
  }

  return (
    <div className="space-y-4">
      {closingSoon.length > 0 && (
        <div>
          <h3 className="mb-1 flex items-center gap-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Target className="size-3.5" aria-hidden="true" />
            临近报名截止
            <span className="num-tabular rounded-sm bg-status-expiring-soft px-1.5 py-0.5 text-[11px] font-semibold text-status-expiring-foreground">
              {closingSoon.length}
            </span>
          </h3>
          <ul className="divide-y divide-border">
            {closingSoon.map((item, index) => (
              <ClosingSoonRow
                key={item.id.toString()}
                item={item}
                index={index + 1}
              />
            ))}
          </ul>
        </div>
      )}

      {pendingConfirmations.length > 0 && (
        <div>
          <h3 className="mb-1 flex items-center gap-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <CircleHelp className="size-3.5" aria-hidden="true" />
            待确认核对结论
            <span className="num-tabular rounded-sm bg-status-pending-soft px-1.5 py-0.5 text-[11px] font-semibold text-status-pending-foreground">
              {pendingConfirmations.length}
            </span>
          </h3>
          <ul className="divide-y divide-border">
            {pendingConfirmations.map((item, index) => (
              <PendingConfirmationRow
                key={item.id.toString()}
                item={item}
                index={index + 1}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
