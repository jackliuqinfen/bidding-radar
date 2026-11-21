import type { RecordView } from "@/backend";
import { RecordBadges } from "@/components/records/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { AlertTriangle, RotateCw } from "lucide-react";

/**
 * Shown when a save is rejected because the record changed underneath the user.
 * Displays the latest stored values beside the user's retained input.
 */
export function ConflictBanner({
  latest,
  onResubmit,
  pending,
}: {
  latest: RecordView;
  onResubmit?: () => void;
  pending?: boolean;
}) {
  return (
    <div
      role="alert"
      data-ocid="record.conflict.banner"
      className="rounded-lg border border-status-expiring-border bg-status-expiring-soft px-4 py-3 text-sm"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-status-expiring-foreground"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-medium text-foreground">
            该档案已被他人更新，您填写的内容已保留。
          </p>
          <div className="rounded-md border border-border bg-card px-3 py-2">
            <p className="mb-1 text-xs text-muted-foreground">最新版本</p>
            <p className="truncate font-medium text-foreground">
              {latest.title}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <RecordBadges
                status={latest.status}
                expiryFlag={latest.expiryFlag}
              />
              <span className="text-xs text-muted-foreground">
                版本 {latest.version.toString()} · {latest.lastModifiedByName} ·{" "}
                {formatDateTime(latest.lastModifiedAt)}
              </span>
            </div>
          </div>
          {onResubmit && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-ocid="record.conflict.resubmit_button"
              onClick={onResubmit}
              disabled={pending}
            >
              <RotateCw className="size-3.5" aria-hidden="true" />
              以最新版本重新提交
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
