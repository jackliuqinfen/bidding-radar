import type { OpportunityView } from "@/backend";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState, LoadingState } from "@/components/common/States";
import { AnnouncementBody } from "@/components/opportunities/AnnouncementBody";
import { DeadlineBadge } from "@/components/opportunities/DeadlineBadge";
import { OpportunityStatusBadge } from "@/components/opportunities/OpportunityStatusBadge";
import { QualificationCheckPanel } from "@/components/opportunities/QualificationCheckPanel";
import { StatusChangePanel } from "@/components/opportunities/StatusChangePanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyAccount } from "@/hooks/useAccount";
import {
  useCheckItems,
  useOpportunity,
  useOpportunityStatusHistory,
} from "@/hooks/useOpportunities";
import { describeError } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/format";
import { opportunitySearch } from "@/lib/opportunitySearch";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Building2,
  CalendarClock,
  ChevronLeft,
  ExternalLink,
  FileText,
  UserRound,
  Wallet,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

function MetaField({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-words text-sm text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}

function AnnouncementMeta({ data }: { data: OpportunityView }) {
  return (
    <section
      data-ocid="opportunity_detail.meta"
      className="rounded-lg border border-border bg-card p-5 shadow-subtle"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetaField
          icon={<Building2 className="size-4" aria-hidden="true" />}
          label="招标人"
          value={data.tenderer}
        />
        <MetaField
          icon={<FileText className="size-4" aria-hidden="true" />}
          label="项目类型"
          value={data.projectTypeLabel}
        />
        <MetaField
          icon={<Wallet className="size-4" aria-hidden="true" />}
          label="预算金额"
          value={
            data.budgetYuan !== undefined
              ? `¥${data.budgetYuan.toLocaleString("zh-CN")}`
              : "未公布"
          }
        />
        <MetaField
          icon={<CalendarClock className="size-4" aria-hidden="true" />}
          label="发布日期"
          value={formatDate(data.publishDate)}
        />
        <MetaField
          icon={<CalendarClock className="size-4" aria-hidden="true" />}
          label="报名截止"
          value={formatDate(data.registrationDeadline)}
        />
        <MetaField
          icon={<CalendarClock className="size-4" aria-hidden="true" />}
          label="开标时间"
          value={formatDateTime(data.bidOpenTime)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <UserRound className="size-3.5" aria-hidden="true" />
          录入人 {data.createdByName}
        </span>
        <span>录入时间 {formatDateTime(data.createdAt)}</span>
        <span>
          最近修改 {data.lastModifiedByName} ·{" "}
          {formatDateTime(data.lastModifiedAt)}
        </span>
        {data.sourceUrl ? (
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-ocid="opportunity_detail.source_link"
            className="inline-flex items-center gap-1 rounded-sm font-medium text-primary underline-offset-4 transition-smooth hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            查看原公告（{data.sourceName || "来源"}）
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        ) : (
          <span>来源：{data.sourceName || "未记录"}</span>
        )}
      </div>
    </section>
  );
}

export default function OpportunityDetailPage() {
  const params = useParams({ from: "/opportunities/$opportunityId" });
  const navigate = useNavigate();
  const account = useMyAccount();

  const opportunityId = useMemo(() => {
    try {
      return BigInt(params.opportunityId);
    } catch {
      return null;
    }
  }, [params.opportunityId]);

  const opportunity = useOpportunity(opportunityId ?? undefined);
  const history = useOpportunityStatusHistory(opportunityId ?? undefined);
  const checkItems = useCheckItems(opportunityId ?? undefined);

  const [markingCompanyId, setMarkingCompanyId] = useState<bigint | null>(null);

  const backLink = (
    <button
      type="button"
      data-ocid="opportunity_detail.back_button"
      onClick={() =>
        void navigate({ to: "/opportunities", search: opportunitySearch() })
      }
      className="inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground transition-smooth hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronLeft className="size-3.5" aria-hidden="true" />
      机会池
    </button>
  );

  if (opportunityId === null) {
    return (
      <div data-ocid="opportunity_detail.page">
        <PageHeader title="公告详情" breadcrumb={backLink} />
        <ErrorState message="公告编号无效，请返回机会池重新选择。" />
      </div>
    );
  }

  if (opportunity.isLoading) {
    return (
      <div data-ocid="opportunity_detail.page">
        <PageHeader title="公告详情" breadcrumb={backLink} />
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 shadow-subtle">
            <Skeleton className="mb-3 h-5 w-1/2" />
            <Skeleton className="mb-2 h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <LoadingState rows={2} label="正在加载公告…" />
        </div>
      </div>
    );
  }

  if (opportunity.isError) {
    return (
      <div data-ocid="opportunity_detail.page">
        <PageHeader title="公告详情" breadcrumb={backLink} />
        <ErrorState
          message={describeError(opportunity.error)}
          onRetry={() => void opportunity.refetch()}
        />
      </div>
    );
  }

  const data = opportunity.data;
  if (!data) {
    return (
      <div data-ocid="opportunity_detail.page">
        <PageHeader title="公告详情" breadcrumb={backLink} />
        <ErrorState message="未找到该公告。" />
      </div>
    );
  }

  const items = checkItems.data ?? [];
  const hasConform = items.some((item) => item.conclusion === "conform");
  const selectBlockedReason =
    "已选公司参投前，至少需要一条「符合」的资格核对结论。请先完成核对并确认。";

  return (
    <div data-ocid="opportunity_detail.page">
      <PageHeader
        title={data.projectName}
        breadcrumb={backLink}
        description={`${data.tenderer} · ${data.projectTypeLabel}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <OpportunityStatusBadge status={data.status} />
            <DeadlineBadge
              daysRemaining={data.daysRemaining}
              registrationDeadline={data.registrationDeadline}
            />
            {data.draft && (
              <span className="rounded-sm border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                草稿
              </span>
            )}
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <AnnouncementMeta data={data} />

          <section
            data-ocid="opportunity_detail.body_panel"
            className="rounded-lg border border-border bg-card p-5 shadow-subtle"
          >
            <h2 className="mb-3 font-display text-base font-semibold text-foreground">
              公告正文
            </h2>
            <AnnouncementBody body={data.body} clauses={data.clauses} />
          </section>

          <QualificationCheckPanel
            opportunityId={data.id}
            items={items}
            currentPrincipal={account.data?.principal.toText() ?? null}
            onMarkCandidate={setMarkingCompanyId}
            markingCompanyId={markingCompanyId}
          />
        </div>

        <aside className="min-w-0 space-y-5">
          <StatusChangePanel
            opportunityId={data.id}
            currentStatus={data.status}
            history={history.data ?? []}
            canSelect={hasConform}
            selectBlockedReason={selectBlockedReason}
          />
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">核对说明</p>
            <p>
              公告未写明或资料缺失的核对项默认「待核」，不提供自动「不符合」结论。
              核对结论须由具备该公司「核实」权限的成员确认，创建人不能确认本人提交的结论。
            </p>
            <Button
              type="button"
              variant="link"
              size="sm"
              data-ocid="opportunity_detail.back_to_list_button"
              className="mt-2 h-auto px-0 text-xs"
              onClick={() =>
                void navigate({
                  to: "/opportunities",
                  search: opportunitySearch(),
                })
              }
            >
              返回机会池
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
