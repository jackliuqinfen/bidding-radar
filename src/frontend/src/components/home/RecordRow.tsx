import type { RecordView } from "@/backend";
import { RecordBadges } from "@/components/records/StatusBadge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

/** One record line on the home page; opens the record detail sheet. */
export function RecordRow({
  record,
  onOpen,
  ocid,
}: {
  record: RecordView;
  onOpen: (record: RecordView) => void;
  ocid: string;
}) {
  const validTo = expiryDate(record);
  return (
    <button
      type="button"
      data-ocid={ocid}
      onClick={() => onOpen(record)}
      className={cn(
        "group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-smooth",
        "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-medium text-foreground">
          {record.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {record.companyName} · {record.kindLabel}
          {validTo ? ` · 有效期至 ${validTo}` : ""}
        </p>
        <RecordBadges status={record.status} expiryFlag={record.expiryFlag} />
      </div>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </button>
  );
}

function expiryDate(record: RecordView): string | undefined {
  const data = record.data;
  switch (data.__kind__) {
    case "license":
      return data.license.validTo
        ? formatDate(data.license.validTo)
        : undefined;
    case "personCert":
      return data.personCert.validTo
        ? formatDate(data.personCert.validTo)
        : undefined;
    default:
      return undefined;
  }
}
