import { RecordStatus, type RecordView } from "@/backend";
import { EmptyState } from "@/components/common/States";
import { RecordRow } from "@/components/home/RecordRow";
import { Button } from "@/components/ui/button";
import { dashboardSearch } from "@/lib/dashboardSearch";
import { Link } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";

/** Records the caller may verify, each opening the detail sheet. */
export function VerifyQueue({
  records,
  onOpen,
}: {
  records: RecordView[];
  onOpen: (record: RecordView) => void;
}) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck className="size-5" aria-hidden="true" />}
        title="暂无待核档案"
        description="有新的档案提交待核时会出现在这里。"
        action={
          <Button asChild type="button" variant="outline" size="sm">
            <Link
              to="/dashboard"
              search={(prev) => ({
                status: RecordStatus.pendingReview,
                expiry: prev.expiry,
                category: prev.category,
                owner: prev.owner,
                company: prev.company,
              })}
            >
              查看缺口看板
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {records.map((record, index) => (
        <li key={record.id.toString()}>
          <RecordRow
            record={record}
            onOpen={onOpen}
            ocid={`home.verify_item.${index + 1}`}
          />
        </li>
      ))}
    </ul>
  );
}
