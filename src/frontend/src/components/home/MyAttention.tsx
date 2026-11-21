import { ExpiryFlag, RecordStatus, type RecordView } from "@/backend";
import { EmptyState } from "@/components/common/States";
import { RecordRow } from "@/components/home/RecordRow";
import { Button } from "@/components/ui/button";
import { dashboardSearch } from "@/lib/dashboardSearch";
import { Link } from "@tanstack/react-router";
import { CircleCheck } from "lucide-react";

/** The caller's own records needing attention, grouped by what to do next. */
export function MyAttention({
  records,
  onOpen,
}: {
  records: RecordView[];
  onOpen: (record: RecordView) => void;
}) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={<CircleCheck className="size-5" aria-hidden="true" />}
        title="您负责的档案暂无待办"
        description="待补、临近到期与已过期的档案会集中显示在这里。"
        action={
          <Button asChild type="button" variant="outline" size="sm">
            <Link
              to="/dashboard"
              search={(prev) => ({
                status: prev.status,
                expiry: prev.expiry,
                category: prev.category,
                owner: prev.owner,
                company: prev.company,
              })}
            >
              查看我的档案
            </Link>
          </Button>
        }
      />
    );
  }

  const groups = [
    {
      key: "missing",
      label: "待补",
      items: records.filter((r) => r.status === RecordStatus.missing),
    },
    {
      key: "nearExpiry",
      label: "临近到期",
      items: records.filter((r) => r.expiryFlag === ExpiryFlag.nearExpiry),
    },
    {
      key: "expired",
      label: "已过期",
      items: records.filter((r) => r.expiryFlag === ExpiryFlag.expired),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.key} data-ocid={`home.attention.${group.key}`}>
          <h3 className="mb-1 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
            <span className="num-tabular rounded-sm bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground">
              {group.items.length}
            </span>
          </h3>
          <ul className="divide-y divide-border/60">
            {group.items.map((record, index) => (
              <li key={record.id.toString()}>
                <RecordRow
                  record={record}
                  onOpen={onOpen}
                  ocid={`home.attention_item.${group.key}.${index + 1}`}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
