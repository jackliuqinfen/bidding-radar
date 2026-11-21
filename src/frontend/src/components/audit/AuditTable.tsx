import type { AuditEntryView } from "@/backend";
import { AuditResult as AuditResultEnum } from "@/backend";
import { AuditResultBadge } from "@/components/audit/AuditResultBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { AUDIT_ACTION_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Building2, ShieldX } from "lucide-react";

function DenialReason({ reason }: { reason?: string }) {
  if (!reason) return null;
  return (
    <p className="mt-1 flex items-start gap-1 text-xs text-status-expired-foreground">
      <ShieldX className="mt-px size-3 shrink-0" aria-hidden="true" />
      <span className="min-w-0 break-words">拒绝原因：{reason}</span>
    </p>
  );
}

/** Desktop table view of the audit log. */
export function AuditTable({ entries }: { entries: AuditEntryView[] }) {
  return (
    <div
      data-ocid="audit.table"
      className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle"
    >
      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[150px] whitespace-nowrap">时间</TableHead>
            <TableHead className="w-[140px]">操作人</TableHead>
            <TableHead className="w-[130px]">操作</TableHead>
            <TableHead>对象</TableHead>
            <TableHead className="w-[160px]">公司</TableHead>
            <TableHead className="w-[110px]">结果</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => {
            const denied = entry.result === AuditResultEnum.denied;
            return (
              <TableRow
                key={entry.id.toString()}
                data-ocid={`audit.row.${index + 1}`}
                className={cn(
                  "align-top",
                  denied &&
                    "bg-status-expired-soft/40 hover:bg-status-expired-soft/60",
                )}
              >
                <TableCell className="num-tabular whitespace-nowrap text-muted-foreground">
                  {formatDateTime(entry.at)}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {entry.operatorName}
                </TableCell>
                <TableCell className="text-foreground">
                  {AUDIT_ACTION_LABELS[entry.action] ?? entry.actionLabel}
                </TableCell>
                <TableCell className="min-w-0">
                  <span className="block break-words text-foreground">
                    {entry.target || "—"}
                  </span>
                  {denied && <DenialReason reason={entry.denialReason} />}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {entry.companyName ? (
                    <span className="flex items-center gap-1.5">
                      <Building2
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 break-words">
                        {entry.companyName}
                      </span>
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <AuditResultBadge result={entry.result} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/** Mobile card layout: one readable card per entry. */
export function AuditCardList({ entries }: { entries: AuditEntryView[] }) {
  return (
    <ul data-ocid="audit.list" className="space-y-3">
      {entries.map((entry, index) => {
        const denied = entry.result === AuditResultEnum.denied;
        return (
          <li
            key={entry.id.toString()}
            data-ocid={`audit.item.${index + 1}`}
            className={cn(
              "rounded-lg border border-border bg-card p-4 shadow-subtle",
              denied &&
                "border-status-expired-border bg-status-expired-soft/30",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold text-foreground">
                  {AUDIT_ACTION_LABELS[entry.action] ?? entry.actionLabel}
                </p>
                <p className="num-tabular mt-0.5 text-xs text-muted-foreground">
                  {formatDateTime(entry.at)}
                </p>
              </div>
              <AuditResultBadge result={entry.result} className="shrink-0" />
            </div>

            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="w-14 shrink-0 text-xs text-muted-foreground">
                  操作人
                </dt>
                <dd className="min-w-0 break-words text-foreground">
                  {entry.operatorName}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-14 shrink-0 text-xs text-muted-foreground">
                  对象
                </dt>
                <dd className="min-w-0 break-words text-foreground">
                  {entry.target || "—"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-14 shrink-0 text-xs text-muted-foreground">
                  公司
                </dt>
                <dd className="min-w-0 break-words text-foreground">
                  {entry.companyName ?? "—"}
                </dd>
              </div>
            </dl>

            {denied && (
              <div className="mt-3 rounded-md border border-status-expired-border bg-status-expired-soft/60 px-2.5 py-2">
                <DenialReason reason={entry.denialReason} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
