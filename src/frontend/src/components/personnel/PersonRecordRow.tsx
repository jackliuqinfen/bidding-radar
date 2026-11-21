import type { RecordView } from "@/backend";
import { RecordBadges } from "@/components/records/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChevronRight, FileText } from "lucide-react";

function summary(record: RecordView): string {
  const data = record.data;
  switch (data.__kind__) {
    case "personCert":
      return [
        data.personCert.number && `编号 ${data.personCert.number}`,
        data.personCert.issuingAuthority,
        data.personCert.validTo
          ? `有效期至 ${formatDate(data.personCert.validTo)}`
          : "长期有效",
      ]
        .filter(Boolean)
        .join(" · ");
    case "personTrack":
      return [
        data.personTrack.role,
        data.personTrack.completionDate
          ? `竣工 ${formatDate(data.personTrack.completionDate)}`
          : "竣工日期未填",
      ]
        .filter(Boolean)
        .join(" · ");
    default:
      return record.kindLabel;
  }
}

export function PersonRecordRow({
  record,
  index,
  onOpen,
}: {
  record: RecordView;
  index: number;
  onOpen: (record: RecordView) => void;
}) {
  return (
    <li>
      <Button
        type="button"
        variant="ghost"
        data-ocid={`person.record.item.${index}`}
        onClick={() => onOpen(record)}
        className={cn(
          "h-auto w-full justify-start gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left font-normal shadow-subtle transition-smooth",
          "hover:border-primary/40 hover:bg-card hover:shadow-elevated",
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <FileText className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 space-y-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-medium text-foreground">
              {record.title}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {record.kindLabel}
            </span>
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {summary(record)}
          </span>
          <RecordBadges
            status={record.status}
            expiryFlag={record.expiryFlag}
            className="pt-0.5"
          />
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </Button>
    </li>
  );
}
