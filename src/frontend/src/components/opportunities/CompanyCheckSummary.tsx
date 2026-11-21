import type { CheckConclusion, CheckItemView } from "@/backend";
import { CheckConclusion as CheckConclusionEnum } from "@/backend";
import { Button } from "@/components/ui/button";
import { CHECK_CONCLUSION_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Building2, Lock, Plus } from "lucide-react";

export interface CompanyCheckGroup {
  companyId: bigint;
  companyName: string;
  canView: boolean;
  canEdit: boolean;
  canVerify: boolean;
  items: CheckItemView[];
}

const CONCLUSION_ORDER: CheckConclusion[] = [
  CheckConclusionEnum.conform,
  CheckConclusionEnum.nonConform,
  CheckConclusionEnum.pending,
];

const COUNT_STYLES: Record<CheckConclusion, string> = {
  [CheckConclusionEnum.conform]:
    "bg-status-verified-soft text-status-verified-foreground",
  [CheckConclusionEnum.nonConform]:
    "bg-status-expired-soft text-status-expired-foreground",
  [CheckConclusionEnum.pending]:
    "bg-status-pending-soft text-status-pending-foreground",
};

/**
 * Per-company progress summary: 符合/不符合/待核 counts and a one-click action
 * to mark the company as a 参投候选 (only when it has a 符合 conclusion).
 */
export function CompanyCheckSummary({
  groups,
  onStartCheck,
  onMarkCandidate,
  markingCompanyId,
}: {
  groups: CompanyCheckGroup[];
  onStartCheck: (companyId: bigint) => void;
  onMarkCandidate: (companyId: bigint) => void;
  markingCompanyId: bigint | null;
}) {
  if (groups.length === 0) {
    return (
      <p
        data-ocid="check_summary.empty_state"
        className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground"
      >
        尚未对任何公司发起资格核对。
      </p>
    );
  }

  return (
    <ul data-ocid="check_summary.list" className="space-y-2">
      {groups.map((group, index) => {
        const counts: Record<CheckConclusion, number> = {
          [CheckConclusionEnum.conform]: 0,
          [CheckConclusionEnum.nonConform]: 0,
          [CheckConclusionEnum.pending]: 0,
        };
        for (const item of group.items) counts[item.conclusion] += 1;
        const hasConform = counts[CheckConclusionEnum.conform] > 0;
        const isMarking = markingCompanyId === group.companyId;

        return (
          <li
            key={group.companyId.toString()}
            data-ocid={`check_summary.item.${index + 1}`}
            className="rounded-lg border border-border bg-card p-3.5 shadow-subtle"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Building2 className="size-3.5" aria-hidden="true" />
                </span>
                <span className="truncate text-sm font-medium text-foreground">
                  {group.companyName}
                </span>
                {!group.canView && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="size-3" aria-hidden="true" />
                    无权限查看该公司资料
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {CONCLUSION_ORDER.map((conclusion) => (
                  <span
                    key={conclusion}
                    className={cn(
                      "rounded-sm px-1.5 py-0.5 text-xs font-medium num-tabular",
                      COUNT_STYLES[conclusion],
                    )}
                  >
                    {CHECK_CONCLUSION_LABELS[conclusion]} {counts[conclusion]}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {group.canEdit && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-ocid={`check_summary.start_button.${index + 1}`}
                  onClick={() => onStartCheck(group.companyId)}
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  发起核对
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant={hasConform ? "default" : "outline"}
                data-ocid={`check_summary.candidate_button.${index + 1}`}
                disabled={!hasConform || isMarking}
                title={
                  hasConform
                    ? undefined
                    : "该公司尚无「符合」的核对结论，不能标记为参投候选。"
                }
                onClick={() => onMarkCandidate(group.companyId)}
              >
                {isMarking ? "处理中…" : "标记为参投候选"}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
