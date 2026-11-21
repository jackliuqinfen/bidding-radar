import type { CheckItemView, RecordView } from "@/backend";
import { OpportunityStatus as OpportunityStatusEnum } from "@/backend";
import { CheckItemRow } from "@/components/opportunities/CheckItemRow";
import {
  type CompanyCheckGroup,
  CompanyCheckSummary,
} from "@/components/opportunities/CompanyCheckSummary";
import { QualificationCheckForm } from "@/components/opportunities/QualificationCheckForm";
import { useMyAccess } from "@/components/personnel/usePersonnel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanies } from "@/hooks/useCompanies";
import { useChangeOpportunityStatus } from "@/hooks/useOpportunityMutations";
import { useRecords } from "@/hooks/useRecords";
import { describeError } from "@/lib/errors";
import { ClipboardCheck, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

/**
 * Qualification checks for one announcement: per-company progress, the check
 * item list, and the create/edit dialog. Company evidence is only shown when
 * the caller holds that company's 查看 permission.
 */
export function QualificationCheckPanel({
  opportunityId,
  items,
  currentPrincipal,
  onMarkCandidate,
  markingCompanyId,
}: {
  opportunityId: bigint;
  items: CheckItemView[];
  currentPrincipal: string | null;
  onMarkCandidate: (companyId: bigint) => void;
  markingCompanyId: bigint | null;
}) {
  const companies = useCompanies();
  const access = useMyAccess();
  const changeStatus = useChangeOpportunityStatus();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CheckItemView | undefined>(undefined);
  const [formCompanyId, setFormCompanyId] = useState<bigint | null>(null);

  const companyList = companies.data ?? [];

  const groups = useMemo<CompanyCheckGroup[]>(() => {
    const byCompany = new Map<string, CheckItemView[]>();
    for (const item of items) {
      const key = item.companyId.toString();
      const list = byCompany.get(key) ?? [];
      list.push(item);
      byCompany.set(key, list);
    }
    return companyList.map((company) => {
      const companyAccess = access.accessFor(company.id);
      return {
        companyId: company.id,
        companyName: company.name,
        canView: companyAccess.canView,
        canEdit: companyAccess.canEdit,
        canVerify: companyAccess.canVerify,
        items: byCompany.get(company.id.toString()) ?? [],
      };
    });
  }, [companyList, items, access]);

  const activeCompanyId = useMemo(() => {
    if (selectedCompanyId) return BigInt(selectedCompanyId);
    return groups[0]?.companyId ?? null;
  }, [selectedCompanyId, groups]);

  const activeGroup = groups.find(
    (group) => group.companyId === activeCompanyId,
  );

  const recordsQuery = useRecords(
    activeCompanyId !== null ? { companyId: activeCompanyId } : {},
  );
  const activeRecords: RecordView[] = activeGroup?.canView
    ? (recordsQuery.data ?? [])
    : [];

  const formCompany = groups.find((group) => group.companyId === formCompanyId);
  const formRecordsQuery = useRecords(
    formCompanyId !== null ? { companyId: formCompanyId } : {},
  );
  const formRecords: RecordView[] = formCompany?.canView
    ? (formRecordsQuery.data ?? [])
    : [];

  const openCreate = (companyId: bigint) => {
    setEditing(undefined);
    setFormCompanyId(companyId);
    setFormOpen(true);
  };

  const openEdit = (item: CheckItemView) => {
    setEditing(item);
    setFormCompanyId(item.companyId);
    setFormOpen(true);
  };

  const handleMarkCandidate = (companyId: bigint) => {
    const company = groups.find((group) => group.companyId === companyId);
    changeStatus.mutate(
      {
        id: opportunityId,
        toStatus: OpportunityStatusEnum.selected,
        reason: `资格核对通过，将「${company?.companyName ?? "该公司"}」标记为参投候选。`,
      },
      {
        onSuccess: () => {
          toast.success("已标记为参投候选");
          onMarkCandidate(companyId);
        },
        onError: (err) => toast.error(describeError(err)),
      },
    );
  };

  return (
    <section
      data-ocid="opportunity_detail.check_panel"
      className="rounded-lg border border-border bg-card p-5 shadow-subtle"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 font-display text-base font-semibold text-foreground">
          <ClipboardCheck className="size-4 text-primary" aria-hidden="true" />
          资格核对
        </h2>
        {activeGroup?.canEdit && (
          <Button
            type="button"
            size="sm"
            data-ocid="opportunity_detail.start_check_button"
            onClick={() => openCreate(activeGroup.companyId)}
          >
            <Plus className="size-4" aria-hidden="true" />
            发起核对
          </Button>
        )}
      </div>

      <CompanyCheckSummary
        groups={groups}
        onStartCheck={openCreate}
        onMarkCandidate={handleMarkCandidate}
        markingCompanyId={markingCompanyId}
      />

      <div className="mt-5 border-t border-border pt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground">核对项明细</h3>
          {groups.length > 0 && (
            <Select
              value={activeCompanyId?.toString() ?? ""}
              onValueChange={setSelectedCompanyId}
            >
              <SelectTrigger
                data-ocid="opportunity_detail.company.select"
                size="sm"
                className="w-48"
              >
                <SelectValue placeholder="选择公司" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem
                    key={group.companyId.toString()}
                    value={group.companyId.toString()}
                  >
                    {group.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {!activeGroup ? (
          <p className="text-sm text-muted-foreground">
            请先选择公司，再发起资格核对。
          </p>
        ) : !activeGroup.canView ? (
          <p
            data-ocid="opportunity_detail.check.no_permission"
            className="rounded-md border border-border bg-muted/50 px-3 py-3 text-sm text-muted-foreground"
          >
            无权限查看该公司资料，核对项内容已隐藏。
          </p>
        ) : activeGroup.items.length === 0 ? (
          <p
            data-ocid="opportunity_detail.check.empty_state"
            className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground"
          >
            该公司尚无核对结论。公告未写明或资料缺失的核对项应记为「待核」。
          </p>
        ) : (
          <ul className="space-y-2.5">
            {activeGroup.items.map((item, index) => (
              <CheckItemRow
                key={item.id.toString()}
                item={item}
                index={index}
                records={activeRecords}
                canViewRecords={activeGroup.canView}
                canEdit={activeGroup.canEdit}
                canVerify={activeGroup.canVerify}
                isCreator={
                  currentPrincipal !== null &&
                  item.createdBy.toText() === currentPrincipal
                }
                onEdit={openEdit}
              />
            ))}
          </ul>
        )}
      </div>

      {formOpen && formCompany && formCompanyId !== null && (
        <QualificationCheckForm
          open={formOpen}
          onOpenChange={setFormOpen}
          opportunityId={opportunityId}
          companyId={formCompanyId}
          companyName={formCompany.companyName}
          records={formRecords}
          canViewRecords={formCompany.canView}
          editing={editing}
        />
      )}
    </section>
  );
}
