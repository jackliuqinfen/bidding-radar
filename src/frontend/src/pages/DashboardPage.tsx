import type { CompanyGapRow, ExpiryFlag, RecordStatus } from "@/backend";
import {
  ExpiryFlag as ExpiryFlagEnum,
  RecordStatus as RecordStatusEnum,
} from "@/backend";
import { PageHeader } from "@/components/common/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/common/States";
import { CompanyGapCard } from "@/components/dashboard/CompanyGapCard";
import { CompanyGapPanel } from "@/components/dashboard/CompanyGapPanel";
import type { GapFilterState } from "@/components/dashboard/GapFilterBar";
import { attentionCount, totalRecords } from "@/components/dashboard/gapCounts";
import { Button } from "@/components/ui/button";
import { useGapDashboard } from "@/hooks/useDashboard";
import { describeError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Building2, LayoutGrid, ListFilter } from "lucide-react";
import { useMemo } from "react";

const STATUS_VALUES = new Set<string>(Object.values(RecordStatusEnum));
const EXPIRY_VALUES = new Set<string>(Object.values(ExpiryFlagEnum));

function parseCompanyId(raw: string | undefined): bigint | null {
  if (!raw) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const search = useSearch({ from: "/dashboard" });
  const navigate = useNavigate({ from: "/dashboard" });
  const dashboard = useGapDashboard();

  const filters = useMemo<GapFilterState>(
    () => ({
      status: STATUS_VALUES.has(search.status ?? "")
        ? (search.status as RecordStatus)
        : undefined,
      expiry: EXPIRY_VALUES.has(search.expiry ?? "")
        ? (search.expiry as ExpiryFlag)
        : undefined,
      category: search.category || undefined,
      owner: search.owner || undefined,
    }),
    [search.status, search.expiry, search.category, search.owner],
  );

  const selectedId = parseCompanyId(search.company);

  const rows = useMemo<CompanyGapRow[]>(() => {
    const list = dashboard.data ?? [];
    return [...list].sort((a, b) => {
      const diff = attentionCount(b.counts) - attentionCount(a.counts);
      if (diff !== 0n) return diff > 0n ? 1 : -1;
      return a.companyName.localeCompare(b.companyName, "zh-Hans-CN");
    });
  }, [dashboard.data]);

  const selectedRow = useMemo(
    () =>
      selectedId === null
        ? undefined
        : rows.find((row) => row.companyId === selectedId),
    [rows, selectedId],
  );

  const totals = useMemo(() => {
    let records = 0n;
    let attention = 0n;
    for (const row of rows) {
      records += totalRecords(row.counts);
      attention += attentionCount(row.counts);
    }
    return { records, attention };
  }, [rows]);

  const setFilters = (next: GapFilterState) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        status: next.status,
        expiry: next.expiry,
        category: next.category,
        owner: next.owner,
      }),
    });
  };

  const openCompany = (companyId: bigint) => {
    void navigate({
      search: (prev) => ({ ...prev, company: companyId.toString() }),
    });
  };

  const closeCompany = () => {
    void navigate({
      search: (prev) => ({ ...prev, company: undefined }),
    });
  };

  return (
    <div data-ocid="dashboard.page" className="space-y-4">
      <PageHeader
        title="缺口看板"
        description="按公司汇总待补、待核、已核实与到期情况，逐家查看档案明细"
        actions={
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <LayoutGrid className="size-3.5" aria-hidden="true" />
            <span>
              {rows.length} 家公司 · {totals.records.toString()} 份档案 ·{" "}
              <span className="font-medium text-foreground">
                {totals.attention.toString()} 项待处理
              </span>
            </span>
          </div>
        }
      />

      {dashboard.isLoading ? (
        <LoadingState rows={4} label="正在加载缺口看板…" />
      ) : dashboard.isError ? (
        <ErrorState
          message={describeError(dashboard.error)}
          onRetry={() => void dashboard.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="还没有可统计的公司"
          description="管理员登记公司并补充档案后，这里会按公司汇总缺口数量。"
          icon={<Building2 className="size-5" aria-hidden="true" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ListFilter className="size-3.5" aria-hidden="true" />
              按待处理数量排序
            </div>
            <ul data-ocid="dashboard.company.list" className="space-y-2.5">
              {rows.map((row, index) => (
                <li key={row.companyId.toString()}>
                  <div data-ocid={`dashboard.company.item.${index + 1}`}>
                    <CompanyGapCard
                      row={row}
                      selected={row.companyId === selectedId}
                      onOpen={() => openCompany(row.companyId)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className={cn("min-w-0", selectedRow ? "" : "hidden lg:block")}>
            {selectedRow ? (
              <CompanyGapPanel
                key={selectedRow.companyId.toString()}
                companyId={selectedRow.companyId}
                companyName={selectedRow.companyName}
                canView={selectedRow.canView}
                filters={filters}
                onFiltersChange={setFilters}
                onClose={closeCompany}
              />
            ) : (
              <div
                data-ocid="dashboard.detail.placeholder"
                className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/60 px-6 py-16 text-center"
              >
                <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <ListFilter className="size-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <p className="font-display text-sm font-semibold text-foreground">
                    选择一家公司查看明细
                  </p>
                  <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                    点击左侧公司的「查看明细」，可按状态、到期、类别与维护责任人筛选档案。
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid="dashboard.detail.open_first_button"
                  onClick={() => openCompany(rows[0].companyId)}
                >
                  查看待处理最多的公司
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
