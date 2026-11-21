import { AccountRole } from "@/backend";
import type { AuditFilter } from "@/backend";
import {
  type AuditFilterState,
  AuditFilters,
  EMPTY_AUDIT_FILTERS,
} from "@/components/audit/AuditFilters";
import { AuditCardList, AuditTable } from "@/components/audit/AuditTable";
import { PageHeader } from "@/components/common/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { useMyAccount } from "@/hooks/useAccount";
import { useAccounts } from "@/hooks/useAccounts";
import { useAuditLog } from "@/hooks/useAudit";
import { useCompanies } from "@/hooks/useCompanies";
import { describeError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { Principal } from "@icp-sdk/core/principal";
import { ChevronLeft, ChevronRight, Lock, ScrollText } from "lucide-react";
import { useMemo, useState } from "react";

const PAGE_SIZE = 25n;

function PermissionDenied() {
  return (
    <div data-ocid="audit.permission_denied">
      <PageHeader title="审计日志" description="记录所有关键操作与拒绝访问" />
      <EmptyState
        icon={<Lock className="size-5" aria-hidden="true" />}
        title="仅管理员可查看审计日志"
        description="当前账号没有查看审计日志的权限。如需访问，请联系管理员调整角色。"
      />
    </div>
  );
}

function toFilter(state: AuditFilterState, offset: bigint): AuditFilter {
  const filter: AuditFilter = { offset, limit: PAGE_SIZE };
  if (state.action !== "all") filter.action = state.action;
  if (state.result !== "all") filter.result = state.result;
  if (state.operator !== "all") {
    filter.operator = Principal.fromText(state.operator);
  }
  if (state.company !== "all") filter.companyId = BigInt(state.company);
  return filter;
}

function AuditLogView() {
  const [filters, setFilters] = useState<AuditFilterState>(EMPTY_AUDIT_FILTERS);
  const [offset, setOffset] = useState(0n);

  const { data: accounts } = useAccounts();
  const { data: companies } = useCompanies();
  const filter = useMemo(() => toFilter(filters, offset), [filters, offset]);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useAuditLog(filter);

  const operators = useMemo(
    () =>
      (accounts ?? []).map((account) => ({
        principal: account.principal.toText(),
        name: account.displayName,
      })),
    [accounts],
  );

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0n;
  const pageStart = total === 0n ? 0n : offset + 1n;
  const pageEnd = offset + BigInt(entries.length);
  const canPrev = offset > 0n;
  const canNext = pageEnd < total;

  function handleFilterChange(next: AuditFilterState) {
    setFilters(next);
    setOffset(0n);
  }

  return (
    <div data-ocid="audit.page">
      <PageHeader
        title="审计日志"
        description="记录所有关键操作与拒绝访问，按时间倒序排列"
        actions={
          <span className="num-tabular rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
            共 {total.toString()} 条
          </span>
        }
      />

      <AuditFilters
        value={filters}
        onChange={handleFilterChange}
        operators={operators}
        companies={companies ?? []}
        className="mb-4"
      />

      {isLoading ? (
        <LoadingState rows={5} label="正在加载审计日志…" />
      ) : isError ? (
        <ErrorState
          message={describeError(error)}
          onRetry={() => void refetch()}
        />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="size-5" aria-hidden="true" />}
          title="暂无审计记录"
          description="当前筛选条件下没有匹配的操作记录，可调整或清除筛选后重试。"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-ocid="audit.empty_state.reset_button"
              onClick={() => handleFilterChange(EMPTY_AUDIT_FILTERS)}
            >
              清除筛选
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <AuditTable entries={entries} />
          </div>
          <div className="md:hidden">
            <AuditCardList entries={entries} />
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="num-tabular text-xs text-muted-foreground">
              显示第 {pageStart.toString()}–{pageEnd.toString()} 条，共{" "}
              {total.toString()} 条
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid="audit.pagination_prev"
                disabled={!canPrev || isFetching}
                onClick={() =>
                  setOffset((current) =>
                    current >= PAGE_SIZE ? current - PAGE_SIZE : 0n,
                  )
                }
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                上一页
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid="audit.pagination_next"
                disabled={!canNext || isFetching}
                onClick={() => setOffset((current) => current + PAGE_SIZE)}
              >
                下一页
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AuditPage() {
  const { data: account, isLoading } = useMyAccount();

  if (isLoading) {
    return (
      <div data-ocid="audit.page" className={cn("py-2")}>
        <LoadingState rows={4} label="正在校验访问权限…" />
      </div>
    );
  }

  if (!account || account.role !== AccountRole.admin) {
    return <PermissionDenied />;
  }

  return <AuditLogView />;
}
