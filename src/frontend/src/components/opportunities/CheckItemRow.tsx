import type { CheckConclusion, CheckItemView, RecordView } from "@/backend";
import { CheckConclusion as CheckConclusionEnum } from "@/backend";
import { EvidenceList } from "@/components/opportunities/EvidencePicker";
import { CHECK_ITEM_KIND_OPTIONS } from "@/components/opportunities/opportunityConfig";
import { Button } from "@/components/ui/button";
import { useConfirmCheckItem } from "@/hooks/useOpportunityMutations";
import { describeError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { CHECK_CONCLUSION_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  CircleCheck,
  CircleDot,
  CircleX,
  Loader2,
  Pencil,
  Quote,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

const CONCLUSION_STYLES: Record<CheckConclusion, string> = {
  [CheckConclusionEnum.conform]:
    "border-status-verified-border bg-status-verified-soft text-status-verified-foreground",
  [CheckConclusionEnum.nonConform]:
    "border-status-expired-border bg-status-expired-soft text-status-expired-foreground",
  [CheckConclusionEnum.pending]:
    "border-status-pending-border bg-status-pending-soft text-status-pending-foreground",
};

const CONCLUSION_ICONS: Record<CheckConclusion, typeof CircleCheck> = {
  [CheckConclusionEnum.conform]: CircleCheck,
  [CheckConclusionEnum.nonConform]: CircleX,
  [CheckConclusionEnum.pending]: CircleDot,
};

export function CheckItemRow({
  item,
  index,
  records,
  canViewRecords,
  canEdit,
  canVerify,
  isCreator,
  onEdit,
}: {
  item: CheckItemView;
  index: number;
  records: RecordView[];
  canViewRecords: boolean;
  canEdit: boolean;
  canVerify: boolean;
  isCreator: boolean;
  onEdit: (item: CheckItemView) => void;
}) {
  const confirm = useConfirmCheckItem();
  const Icon = CONCLUSION_ICONS[item.conclusion];
  const kindLabel =
    CHECK_ITEM_KIND_OPTIONS.find((option) => option.value === item.kind)
      ?.label ?? item.kindLabel;
  const confirmed = item.confirmation !== undefined;

  const confirmBlockedReason = !canVerify
    ? "需要该公司「核实」权限才能确认。"
    : isCreator
      ? "不能确认本人提交的核对结论，请由其他具备核实权限的成员确认。"
      : confirmed
        ? "该结论已确认。"
        : null;

  const handleConfirm = () => {
    confirm.mutate(item.id, {
      onSuccess: () => toast.success("核对结论已确认"),
      onError: (err) => toast.error(describeError(err)),
    });
  };

  return (
    <li
      data-ocid={`check_item.row.${index + 1}`}
      className="rounded-lg border border-border bg-card p-4 shadow-subtle"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {kindLabel}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.createdByName} · {formatDateTime(item.createdAt)}
            </p>
          </div>
        </div>
        <span
          data-ocid={`check_item.conclusion.${index + 1}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium",
            CONCLUSION_STYLES[item.conclusion],
          )}
        >
          <Icon className="size-3" aria-hidden="true" />
          {CHECK_CONCLUSION_LABELS[item.conclusion]}
        </span>
      </div>

      {item.clauseExcerpt && (
        <div className="mt-3 flex gap-2 rounded-md border-l-2 border-primary/40 bg-muted/40 px-3 py-2">
          <Quote
            className="mt-0.5 size-3 shrink-0 text-primary"
            aria-hidden="true"
          />
          <p className="break-words text-xs text-muted-foreground">
            {item.clauseExcerpt}
          </p>
        </div>
      )}

      <p className="mt-3 break-words text-sm text-foreground">{item.basis}</p>

      {item.evidence.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-muted-foreground">引用档案</p>
          <EvidenceList
            evidence={item.evidence}
            records={records}
            canView={canViewRecords}
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <div className="min-w-0 text-xs">
          {confirmed && item.confirmation ? (
            <span className="inline-flex items-center gap-1 text-status-verified-foreground">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              已由 {item.confirmation.confirmerName} 于{" "}
              {formatDateTime(item.confirmation.confirmedAt)} 确认
            </span>
          ) : (
            <span className="text-muted-foreground">待确认</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-ocid={`check_item.edit_button.${index + 1}`}
              onClick={() => onEdit(item)}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              修改
            </Button>
          )}
          {!confirmed && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-ocid={`check_item.confirm_button.${index + 1}`}
              disabled={confirmBlockedReason !== null || confirm.isPending}
              title={confirmBlockedReason ?? undefined}
              onClick={handleConfirm}
            >
              {confirm.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="size-3.5" aria-hidden="true" />
              )}
              确认
            </Button>
          )}
        </div>
      </div>

      {!confirmed && confirmBlockedReason && (
        <p
          data-ocid={`check_item.confirm_hint.${index + 1}`}
          className="mt-2 text-xs text-muted-foreground"
        >
          {confirmBlockedReason}
        </p>
      )}
    </li>
  );
}
