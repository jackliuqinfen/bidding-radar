import type { NotificationView } from "@/backend";
import { NotificationKind } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { NOTIFICATION_KIND_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  type Bell,
  Check,
  CircleCheck,
  Clock,
  Loader2,
  ShieldCheck,
  TriangleAlert,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";

const KIND_STYLES: Record<NotificationKind, string> = {
  [NotificationKind.nearExpiry]:
    "bg-status-expiring-soft text-status-expiring-foreground border-status-expiring-border",
  [NotificationKind.expired]:
    "bg-status-expired-soft text-status-expired-foreground border-status-expired-border",
  [NotificationKind.verified]:
    "bg-status-verified-soft text-status-verified-foreground border-status-verified-border",
  [NotificationKind.resetToPending]:
    "bg-status-pending-soft text-status-pending-foreground border-status-pending-border",
  [NotificationKind.permissionChanged]:
    "bg-accent text-accent-foreground border-border",
  [NotificationKind.accountApproved]:
    "bg-status-verified-soft text-status-verified-foreground border-status-verified-border",
  [NotificationKind.accountRejected]:
    "bg-status-expired-soft text-status-expired-foreground border-status-expired-border",
  [NotificationKind.pendingUser]:
    "bg-status-pending-soft text-status-pending-foreground border-status-pending-border",
  [NotificationKind.checkItemConfirmed]:
    "bg-status-verified-soft text-status-verified-foreground border-status-verified-border",
};

const KIND_ICONS: Record<NotificationKind, typeof Bell> = {
  [NotificationKind.nearExpiry]: Clock,
  [NotificationKind.expired]: TriangleAlert,
  [NotificationKind.verified]: CircleCheck,
  [NotificationKind.resetToPending]: ShieldCheck,
  [NotificationKind.permissionChanged]: ShieldCheck,
  [NotificationKind.accountApproved]: UserCheck,
  [NotificationKind.accountRejected]: UserX,
  [NotificationKind.pendingUser]: Users,
  [NotificationKind.checkItemConfirmed]: CircleCheck,
};

export function NotificationItem({
  notification,
  index,
  onMarkRead,
  marking,
}: {
  notification: NotificationView;
  index: number;
  onMarkRead: (id: bigint) => void;
  marking: boolean;
}) {
  const Icon = KIND_ICONS[notification.kind];
  const unread = !notification.read;
  const companyId = notification.companyId;

  const body = (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border",
          KIND_STYLES[notification.kind],
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "rounded-sm gap-1 px-1.5 py-0.5 font-medium",
              KIND_STYLES[notification.kind],
            )}
          >
            {NOTIFICATION_KIND_LABELS[notification.kind]}
          </Badge>
          {unread && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              <span
                className="size-1.5 rounded-full bg-primary"
                aria-hidden="true"
              />
              未读
            </span>
          )}
        </div>
        <p
          className={cn(
            "break-words text-sm",
            unread ? "font-medium text-foreground" : "text-foreground/90",
          )}
        >
          {notification.message}
        </p>
        <p className="num-tabular text-xs text-muted-foreground">
          {formatDateTime(notification.createdAt)}
        </p>
      </div>
    </div>
  );

  return (
    <li
      data-ocid={`notifications.item.${index}`}
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-subtle transition-smooth sm:flex-row sm:items-center sm:justify-between sm:p-4",
        unread ? "border-primary/30" : "border-border",
      )}
    >
      {companyId !== undefined ? (
        <Link
          to="/companies/$companyId"
          params={{ companyId: companyId.toString() }}
          data-ocid={`notifications.link.${index}`}
          className="min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {body}
        </Link>
      ) : (
        <div className="min-w-0">{body}</div>
      )}

      {unread && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-ocid={`notifications.mark_read_button.${index}`}
          className="shrink-0 self-end sm:self-auto"
          disabled={marking}
          onClick={() => onMarkRead(notification.id)}
        >
          {marking ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="size-3.5" aria-hidden="true" />
          )}
          标为已读
        </Button>
      )}
    </li>
  );
}
