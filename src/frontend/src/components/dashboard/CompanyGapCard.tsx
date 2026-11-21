import type { CompanyGapRow } from "@/backend";
import { CountChips } from "@/components/dashboard/CountChips";
import { attentionCount, totalRecords } from "@/components/dashboard/gapCounts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, EyeOff, Lock } from "lucide-react";

/** One company's gap summary. Companies without 查看 show name + counts only. */
export function CompanyGapCard({
  row,
  selected,
  onOpen,
}: {
  row: CompanyGapRow;
  selected: boolean;
  onOpen: () => void;
}) {
  const attention = attentionCount(row.counts);
  const total = totalRecords(row.counts);

  return (
    <div
      data-ocid="dashboard.company.card"
      className={cn(
        "rounded-lg border bg-card p-3 shadow-subtle transition-smooth sm:p-4",
        selected
          ? "border-primary/60 ring-1 ring-primary/30"
          : "border-border hover:border-primary/30",
      )}
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-foreground">
            {row.companyName}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {total === 0n
              ? "暂无档案"
              : `共 ${total.toString()} 份档案 · ${attention.toString()} 项待处理`}
          </p>
        </div>
        <Button
          type="button"
          variant={selected ? "secondary" : "ghost"}
          size="sm"
          className="shrink-0"
          data-ocid="dashboard.company.open_button"
          aria-pressed={selected}
          onClick={onOpen}
        >
          {selected ? "已展开" : "查看明细"}
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Button>
      </div>

      <CountChips counts={row.counts} />

      {!row.canView && (
        <p
          data-ocid="dashboard.company.restricted_note"
          className="mt-2.5 flex items-start gap-1.5 rounded-md bg-muted/60 px-2 py-1.5 text-xs text-muted-foreground"
        >
          <Lock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
          <span>
            您没有该公司的「查看」权限，仅显示名称与统计数量，无法查看档案明细。
          </span>
        </p>
      )}
      {row.canView && total === 0n && (
        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <EyeOff className="size-3" aria-hidden="true" />
          该公司尚未建立任何档案，各项数量均为 0。
        </p>
      )}
    </div>
  );
}
