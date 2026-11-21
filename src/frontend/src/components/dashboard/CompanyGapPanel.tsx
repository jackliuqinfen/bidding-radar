import type { RecordFilter, RecordView } from "@/backend";
import { ErrorState, LoadingState } from "@/components/common/States";
import { RecordList } from "@/components/companies/RecordList";
import { CountChips } from "@/components/dashboard/CountChips";
import {
  GapFilterBar,
  type GapFilterState,
} from "@/components/dashboard/GapFilterBar";
import { RecordDetailSheet } from "@/components/records/RecordDetailSheet";
import { Button } from "@/components/ui/button";
import { useMyAccount } from "@/hooks/useAccount";
import { useCompanyDetail } from "@/hooks/useCompanyDetail";
import { useMyPermissions } from "@/hooks/usePermissions";
import { describeError } from "@/lib/errors";
import { useNavigate } from "@tanstack/react-router";
import { Lock, X } from "lucide-react";
import { useMemo, useState } from "react";

/** Expanded gap detail for one company: filters, counts and the record list. */
export function CompanyGapPanel({
  companyId,
  companyName,
  canView,
  filters,
  onFiltersChange,
  onClose,
}: {
  companyId: bigint;
  companyName: string;
  canView: boolean;
  filters: GapFilterState;
  onFiltersChange: (next: GapFilterState) => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const account = useMyAccount();
  const permissions = useMyPermissions();
  const [sheetRecord, setSheetRecord] = useState<RecordView | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const baseFilter = useMemo<RecordFilter>(() => ({ companyId }), [companyId]);
  const detail = useCompanyDetail(companyId, baseFilter);

  const ownerPrincipal = useMemo(() => {
    if (!filters.owner) return undefined;
    const match = (detail.data?.records ?? []).find(
      (record) => record.maintainerName === filters.owner,
    );
    return match?.maintainer;
  }, [filters.owner, detail.data]);

  const filter = useMemo<RecordFilter>(() => {
    const next: RecordFilter = { companyId };
    if (filters.status) next.status = filters.status;
    if (filters.expiry) next.expiry = filters.expiry;
    if (filters.category) next.category = filters.category;
    if (ownerPrincipal) next.maintainer = ownerPrincipal;
    return next;
  }, [companyId, filters, ownerPrincipal]);

  const filteredDetail = useCompanyDetail(companyId, filter);

  const hasFilters = Boolean(
    filters.status || filters.expiry || filters.category || filters.owner,
  );
  const counts = hasFilters
    ? (filteredDetail.data?.counts ?? detail.data?.counts)
    : detail.data?.counts;
  const listRecords = filteredDetail.data?.records ?? [];

  const isAdmin = account.data?.role === "admin";
  const grant = useMemo(
    () => (permissions.data ?? []).find((g) => g.companyId === companyId),
    [permissions.data, companyId],
  );
  const canEdit = isAdmin || !!grant?.permissions.edit;
  const canVerify = isAdmin || !!grant?.permissions.verify;
  const canSensitiveDownload =
    isAdmin || !!grant?.permissions.sensitiveDownload;

  const owners = useMemo(() => {
    const names = new Set<string>();
    for (const record of detail.data?.records ?? []) {
      if (record.maintainerName) names.add(record.maintainerName);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  }, [detail.data]);

  const openCreate = () => {
    void navigate({
      to: "/companies/$companyId",
      params: { companyId: companyId.toString() },
    });
  };

  const openRecord = (record: RecordView) => {
    setSheetRecord(record);
    setSheetOpen(true);
  };

  return (
    <section
      data-ocid="dashboard.detail.panel"
      aria-label={`${companyName} 缺口明细`}
      className="rounded-lg border border-border bg-card shadow-subtle"
    >
      <header className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate font-display text-base font-semibold text-foreground">
            {companyName}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            档案明细 · 筛选条件保存在地址栏，刷新后仍保留
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          data-ocid="dashboard.detail.close_button"
          onClick={onClose}
        >
          <X className="size-3.5" aria-hidden="true" />
          收起
        </Button>
      </header>

      {!canView ? (
        <div
          data-ocid="dashboard.detail.restricted_note"
          className="flex items-start gap-2 px-4 py-6 text-sm text-muted-foreground"
        >
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            您没有该公司的「查看」权限，无法查看档案明细。如需查看，请联系管理员授予权限。
          </p>
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4">
          {counts && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {hasFilters ? "当前筛选下的数量" : "该公司全部档案数量"}
              </p>
              <CountChips counts={counts} />
            </div>
          )}

          <GapFilterBar
            value={filters}
            onChange={onFiltersChange}
            owners={owners}
          />

          {filteredDetail.isLoading ? (
            <LoadingState rows={3} label="正在加载档案明细…" />
          ) : filteredDetail.isError ? (
            <ErrorState
              message={describeError(filteredDetail.error)}
              onRetry={() => void filteredDetail.refetch()}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                共 {listRecords.length} 份档案
              </p>
              <RecordList
                records={listRecords}
                canEdit={canEdit}
                onOpen={openRecord}
                onCreate={openCreate}
              />
            </div>
          )}
        </div>
      )}

      <RecordDetailSheet
        record={sheetRecord}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        canEdit={canEdit}
        canVerify={canVerify}
        canSensitiveDownload={canSensitiveDownload}
      />
    </section>
  );
}
