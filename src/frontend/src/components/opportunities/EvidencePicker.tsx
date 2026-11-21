import type { RecordStatus, RecordView } from "@/backend";
import { RecordStatus as RecordStatusEnum } from "@/backend";
import { StatusBadge } from "@/components/records/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Lock, Search } from "lucide-react";
import { useMemo, useState } from "react";

/** A record the user may cite as evidence, with its status at citation time. */
export interface EvidenceSelection {
  recordId: bigint;
  statusAtCitation: RecordStatus;
}

function recordSummary(record: RecordView): string {
  const data = record.data;
  switch (data.__kind__) {
    case "license":
      return `${data.license.category} · ${data.license.number}`;
    case "companyTrack":
      return `${data.companyTrack.owner} · ${data.companyTrack.projectName}`;
    case "person":
      return `${data.person.position || "人员"} · ${data.person.name}`;
    case "personCert":
      return `${data.personCert.category} · ${data.personCert.number}`;
    case "personTrack":
      return `${data.personTrack.role} · ${data.personTrack.projectName}`;
  }
}

/**
 * Lets the user cite company archive records as evidence for a check item.
 * Records are only listed when the caller can view the company; otherwise a
 * permission notice replaces the list.
 */
export function EvidencePicker({
  records,
  canView,
  selected,
  onChange,
  disabled,
}: {
  records: RecordView[];
  canView: boolean;
  selected: EvidenceSelection[];
  onChange: (next: EvidenceSelection[]) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");

  const selectedIds = useMemo(
    () => new Set(selected.map((item) => item.recordId.toString())),
    [selected],
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return records;
    return records.filter(
      (record) =>
        record.title.toLowerCase().includes(keyword) ||
        record.kindLabel.toLowerCase().includes(keyword) ||
        recordSummary(record).toLowerCase().includes(keyword),
    );
  }, [records, query]);

  const toggle = (record: RecordView, checked: boolean) => {
    if (checked) {
      onChange([
        ...selected,
        { recordId: record.id, statusAtCitation: record.status },
      ]);
    } else {
      onChange(
        selected.filter(
          (item) => item.recordId.toString() !== record.id.toString(),
        ),
      );
    }
  };

  if (!canView) {
    return (
      <div
        data-ocid="check_form.evidence.no_permission"
        className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground"
      >
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        无权限查看该公司资料，无法引用档案作为佐证。
      </div>
    );
  }

  return (
    <div data-ocid="check_form.evidence" className="space-y-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          data-ocid="check_form.evidence.search_input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索档案名称或类别"
          className="h-8 pl-8 text-sm"
          disabled={disabled}
          aria-label="搜索档案"
        />
      </div>

      {records.length === 0 ? (
        <p
          data-ocid="check_form.evidence.empty_state"
          className="rounded-md border border-dashed border-border px-3 py-3 text-xs text-muted-foreground"
        >
          该公司暂无档案可引用，请先在档案中补充证照、业绩或人员资料。
        </p>
      ) : filtered.length === 0 ? (
        <p className="px-1 py-2 text-xs text-muted-foreground">
          没有匹配的档案。
        </p>
      ) : (
        <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1">
          {filtered.map((record) => {
            const checked = selectedIds.has(record.id.toString());
            const inputId = `evidence-${record.id.toString()}`;
            return (
              <li key={record.id.toString()}>
                <label
                  htmlFor={inputId}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-sm px-2 py-1.5 transition-smooth hover:bg-accent/60",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  <Checkbox
                    id={inputId}
                    data-ocid={`check_form.evidence.checkbox.${record.id.toString()}`}
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(value) => toggle(record, value === true)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm text-foreground">
                        {record.title}
                      </span>
                      <StatusBadge status={record.status} />
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {record.kindLabel} · {recordSummary(record)}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {selected.some(
        (item) => item.statusAtCitation !== RecordStatusEnum.verified,
      ) && (
        <p className="text-xs text-status-pending-foreground">
          引用了待补或待核档案时，核对结论只能为「待核」。
        </p>
      )}
    </div>
  );
}

/** Read-only list of cited evidence with the status captured at citation. */
export function EvidenceList({
  evidence,
  records,
  canView,
}: {
  evidence: { recordId: bigint; statusAtCitation: RecordStatus }[];
  records: RecordView[];
  canView: boolean;
}) {
  if (evidence.length === 0) return null;

  if (!canView) {
    return (
      <p className="text-xs text-muted-foreground">
        无权限查看该公司资料（引用 {evidence.length} 项）。
      </p>
    );
  }

  const byId = new Map(records.map((record) => [record.id.toString(), record]));

  return (
    <ul className="flex flex-wrap gap-1.5">
      {evidence.map((item) => {
        const record = byId.get(item.recordId.toString());
        return (
          <li
            key={item.recordId.toString()}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-muted/50 px-2 py-1 text-xs"
          >
            <span className="max-w-[16rem] truncate text-foreground">
              {record ? record.title : `档案 #${item.recordId.toString()}`}
            </span>
            <StatusBadge status={item.statusAtCitation} />
          </li>
        );
      })}
    </ul>
  );
}
