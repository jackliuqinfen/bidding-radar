import type { OpportunityStatus, StatusChangeView } from "@/backend";
import { OpportunityStatus as OpportunityStatusEnum } from "@/backend";
import { OpportunityStatusBadge } from "@/components/opportunities/OpportunityStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useChangeOpportunityStatus } from "@/hooks/useOpportunityMutations";
import { describeError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/labels";
import { ArrowRight, History, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/** Statuses a user may move an announcement to, excluding the current one. */
const TARGET_STATUSES: OpportunityStatus[] = [
  OpportunityStatusEnum.pendingReview,
  OpportunityStatusEnum.selected,
  OpportunityStatusEnum.declined,
  OpportunityStatusEnum.closed,
];

export function StatusChangePanel({
  opportunityId,
  currentStatus,
  history,
  canSelect,
  selectBlockedReason,
}: {
  opportunityId: bigint;
  currentStatus: OpportunityStatus;
  history: StatusChangeView[];
  /** Whether 已选公司参投 is allowed (at least one 符合 conclusion). */
  canSelect: boolean;
  selectBlockedReason: string;
}) {
  const changeStatus = useChangeOpportunityStatus();
  const [target, setTarget] = useState<OpportunityStatus | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const open = target !== null;
  const reasonMissing = reason.trim().length === 0;

  const startChange = (status: OpportunityStatus) => {
    setTarget(status);
    setReason("");
    setError(null);
  };

  const close = () => {
    setTarget(null);
    setReason("");
    setError(null);
  };

  const submit = () => {
    if (target === null || reasonMissing) return;
    const captured = reason.trim();
    changeStatus.mutate(
      { id: opportunityId, toStatus: target, reason: captured },
      {
        onSuccess: () => {
          toast.success(
            `公告状态已更新为「${OPPORTUNITY_STATUS_LABELS[target]}」`,
          );
          close();
        },
        onError: (err) => setError(describeError(err)),
      },
    );
  };

  return (
    <section
      data-ocid="opportunity_detail.status_panel"
      className="rounded-lg border border-border bg-card p-5 shadow-subtle"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-semibold text-foreground">
          状态变更
        </h2>
        <OpportunityStatusBadge status={currentStatus} />
      </div>

      <div className="flex flex-wrap gap-2">
        {TARGET_STATUSES.filter((status) => status !== currentStatus).map(
          (status) => {
            const blocked =
              status === OpportunityStatusEnum.selected && !canSelect;
            return (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={
                  status === OpportunityStatusEnum.selected
                    ? "default"
                    : "outline"
                }
                data-ocid={`opportunity_detail.status_button.${status}`}
                disabled={blocked}
                title={blocked ? selectBlockedReason : undefined}
                onClick={() => startChange(status)}
              >
                置为{OPPORTUNITY_STATUS_LABELS[status]}
              </Button>
            );
          },
        )}
      </div>

      {!canSelect && (
        <p
          data-ocid="opportunity_detail.select_blocked_hint"
          className="mt-3 rounded-md border border-status-pending-border bg-status-pending-soft px-3 py-2 text-xs text-status-pending-foreground"
        >
          {selectBlockedReason}
        </p>
      )}

      <div className="mt-5 border-t border-border pt-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-foreground">
          <History
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          变更记录
        </h3>
        {history.length === 0 ? (
          <p
            data-ocid="opportunity_detail.status_history.empty_state"
            className="text-sm text-muted-foreground"
          >
            暂无状态变更记录。
          </p>
        ) : (
          <ol
            data-ocid="opportunity_detail.status_history.list"
            className="space-y-3"
          >
            {history.map((entry, index) => (
              <li
                key={entry.id.toString()}
                data-ocid={`opportunity_detail.status_history.item.${index + 1}`}
                className="relative border-l border-border pl-4"
              >
                <span
                  className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {entry.operatorName}
                  </span>
                  <span>·</span>
                  <span>{formatDateTime(entry.at)}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground">
                    {entry.fromStatusLabel}
                  </span>
                  <ArrowRight
                    className="size-3 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="font-medium text-foreground">
                    {entry.toStatusLabel}
                  </span>
                </div>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  原因：{entry.reason}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <Dialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
        <DialogContent data-ocid="opportunity_detail.status_dialog">
          <DialogHeader>
            <DialogTitle>
              变更状态为「{target ? OPPORTUNITY_STATUS_LABELS[target] : ""}」
            </DialogTitle>
            <DialogDescription>
              状态变更需填写原因，记录将保留在公告的变更历史中。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="status-reason">变更原因</Label>
            <Textarea
              id="status-reason"
              data-ocid="opportunity_detail.status_reason.textarea"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="例如：已完成资格核对，选定参投公司。"
              rows={3}
              aria-invalid={error !== null}
            />
            {error && (
              <p
                data-ocid="opportunity_detail.status_dialog.error_state"
                role="alert"
                className="text-xs text-destructive"
              >
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-ocid="opportunity_detail.status_dialog.cancel_button"
              onClick={close}
            >
              取消
            </Button>
            <Button
              type="button"
              data-ocid="opportunity_detail.status_dialog.confirm_button"
              disabled={reasonMissing || changeStatus.isPending}
              onClick={submit}
            >
              {changeStatus.isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              确认变更
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
