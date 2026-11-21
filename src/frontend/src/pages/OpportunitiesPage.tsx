import { PageHeader } from "@/components/common/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/common/States";
import { AnnouncementFormDialog } from "@/components/opportunities/AnnouncementFormDialog";
import { OpportunityFilters } from "@/components/opportunities/OpportunityFilters";
import { OpportunityRow } from "@/components/opportunities/OpportunityRow";
import { Button } from "@/components/ui/button";
import { useOpportunities } from "@/hooks/useOpportunities";
import { describeError } from "@/lib/errors";
import { isRegistrationClosed } from "@/lib/format";
import {
  type OpportunitySearch,
  opportunitySearch,
  toOpportunityFilter,
} from "@/lib/opportunitySearch";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Plus, Target } from "lucide-react";
import { useMemo, useState } from "react";

const FILTER_KEYS = [
  "projectType",
  "status",
  "deadlineFrom",
  "deadlineTo",
  "keyword",
] as const;

export default function OpportunitiesPage() {
  const search = useSearch({ from: "/opportunities" });
  const navigate = useNavigate({ from: "/opportunities" });
  const [dialogOpen, setDialogOpen] = useState(false);

  const filter = useMemo(() => toOpportunityFilter(search), [search]);
  const opportunities = useOpportunities(filter);

  const activeCount = FILTER_KEYS.filter((key) => search[key]).length;

  const updateSearch = (next: Partial<OpportunitySearch>) => {
    void navigate({
      search: (prev) => ({ ...prev, ...next }),
    });
  };

  const resetFilters = () => {
    void navigate({
      search: opportunitySearch({
        sortBy: search.sortBy,
        descending: search.descending,
      }),
    });
  };

  const items = opportunities.data ?? [];
  const closedCount = items.filter((item) =>
    isRegistrationClosed(item.registrationDeadline),
  ).length;

  return (
    <div data-ocid="opportunities.page" className="space-y-4">
      <PageHeader
        title="机会池"
        description="已提交的招标公告，按截止时间与状态跟踪参投机会"
        actions={
          <Button
            type="button"
            data-ocid="opportunities.create_button"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-4" aria-hidden="true" />
            录入公告
          </Button>
        }
      />

      <OpportunityFilters
        search={search}
        onChange={updateSearch}
        onReset={resetFilters}
        activeCount={activeCount}
      />

      {opportunities.isLoading ? (
        <LoadingState rows={4} label="正在加载机会池…" />
      ) : opportunities.isError ? (
        <ErrorState
          message={describeError(opportunities.error)}
          onRetry={() => void opportunities.refetch()}
        />
      ) : items.length === 0 ? (
        activeCount > 0 ? (
          <EmptyState
            title="没有符合条件的公告"
            description="当前筛选下没有公告，调整条件或重置筛选查看全部。"
            icon={<Target className="size-5" aria-hidden="true" />}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid="opportunities.empty_state.reset_button"
                onClick={resetFilters}
              >
                重置筛选
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="机会池还没有公告"
            description="录入一条招标公告并提交后，会出现在这里供资格核对。"
            icon={<Target className="size-5" aria-hidden="true" />}
            action={
              <Button
                type="button"
                data-ocid="opportunities.empty_state.create_button"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="size-4" aria-hidden="true" />
                录入公告
              </Button>
            }
          />
        )
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>
              共 {items.length} 条公告
              {closedCount > 0 && (
                <span className="ml-2 text-status-expired-foreground">
                  · {closedCount} 条已截止
                </span>
              )}
            </p>
            <p className="hidden md:block">点击任意公告查看原文与资格核对</p>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
            <div className="hidden items-center gap-3 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground md:flex">
              <span className="flex-1">项目名称 / 招标人</span>
              <span className="w-32">报名截止</span>
              <span className="w-28 text-right">预算金额</span>
              <span className="w-24">状态</span>
              <span className="w-20 text-right">已核对</span>
              <span className="w-4" />
            </div>
            <ul data-ocid="opportunities.list">
              {items.map((item, index) => (
                <OpportunityRow
                  key={item.id.toString()}
                  item={item}
                  index={index}
                />
              ))}
            </ul>
          </div>
        </div>
      )}

      <AnnouncementFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
