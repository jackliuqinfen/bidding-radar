import type { RecordView } from "@/backend";
import { RecordBadges } from "@/components/records/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatDate, formatFen } from "@/lib/format";
import { PROJECT_TYPE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { ChevronRight, FileText, Plus } from "lucide-react";

/** One-line summary of the record's key fields, per kind. */
function recordSummary(record: RecordView): string {
  const data = record.data;
  switch (data.__kind__) {
    case "license":
      return [
        data.license.number,
        data.license.issuingAuthority,
        data.license.validTo
          ? `有效期至 ${formatDate(data.license.validTo)}`
          : "长期有效",
      ]
        .filter(Boolean)
        .join(" · ");
    case "companyTrack":
      return [
        data.companyTrack.owner,
        data.companyTrack.projectType
          ? PROJECT_TYPE_LABELS[data.companyTrack.projectType]
          : "",
        data.companyTrack.contractAmountFen !== undefined
          ? formatFen(data.companyTrack.contractAmountFen)
          : "",
        data.companyTrack.completionDate
          ? `竣工 ${formatDate(data.companyTrack.completionDate)}`
          : "",
      ]
        .filter(Boolean)
        .join(" · ");
    default:
      return record.remarks || "—";
  }
}

export function RecordList({
  records,
  canEdit,
  onOpen,
  onCreate,
}: {
  records: RecordView[];
  canEdit: boolean;
  onOpen: (record: RecordView) => void;
  onCreate: () => void;
}) {
  if (records.length === 0) {
    return (
      <div
        data-ocid="record.list.empty_state"
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/60 px-6 py-10 text-center"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FileText className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="font-display text-sm font-semibold text-foreground">
            暂无档案
          </p>
          <p className="text-sm text-muted-foreground">
            {canEdit
              ? "登记第一条档案，创建后进入待核状态。"
              : "该公司尚未登记此类档案。"}
          </p>
        </div>
        {canEdit && (
          <Button
            type="button"
            size="sm"
            data-ocid="record.list.create_button"
            onClick={onCreate}
          >
            <Plus className="size-4" aria-hidden="true" />
            新建档案
          </Button>
        )}
      </div>
    );
  }

  return (
    <ul data-ocid="record.list" className="space-y-2">
      {records.map((record, index) => (
        <li key={record.id.toString()}>
          <button
            type="button"
            data-ocid={`record.list.item.${index + 1}`}
            onClick={() => onOpen(record)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left shadow-subtle transition-smooth",
              "hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-sm font-medium text-foreground">
                {record.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {recordSummary(record)}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <RecordBadges
                  status={record.status}
                  expiryFlag={record.expiryFlag}
                />
                <span className="text-[11px] text-muted-foreground">
                  维护责任人 {record.maintainerName}
                </span>
              </div>
            </div>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
