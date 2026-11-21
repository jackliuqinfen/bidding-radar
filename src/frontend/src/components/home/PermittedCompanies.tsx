import type { RecordView } from "@/backend";
import { EmptyState } from "@/components/common/States";
import { RecordRow } from "@/components/home/RecordRow";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";

/** Read-only overview of the companies the caller may view. */
export function PermittedCompanies({
  records,
  onOpen,
}: {
  records: RecordView[];
  onOpen: (record: RecordView) => void;
}) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="size-5" aria-hidden="true" />}
        title="暂无可查看的档案"
        description="您还没有被授予任何公司的查看权限，请联系管理员开通。"
        action={
          <Button asChild type="button" variant="outline" size="sm">
            <Link to="/companies">浏览公司档案</Link>
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
            ocid={`home.permitted_item.${index + 1}`}
          />
        </li>
      ))}
    </ul>
  );
}
