import type { NotificationView } from "@/backend";
import { PageHeader } from "@/components/common/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/common/States";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/hooks/useNotificationMutations";
import { useNotifications, useUnreadCount } from "@/hooks/useNotifications";
import { describeError } from "@/lib/errors";
import { BellOff, CheckCheck, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

export default function NotificationsPage() {
  const notifications = useNotifications();
  const unread = useUnreadCount();
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();
  const [pendingId, setPendingId] = useState<bigint | null>(null);

  const list = useMemo<NotificationView[]>(() => {
    const items = notifications.data ?? [];
    return [...items].sort((a, b) => {
      if (a.createdAt === b.createdAt) return 0;
      return a.createdAt > b.createdAt ? -1 : 1;
    });
  }, [notifications.data]);

  const unreadCount = unread.data ?? 0n;
  const hasUnread = unreadCount > 0n;

  const handleMarkRead = (id: bigint) => {
    setPendingId(id);
    markOne.mutate(id, { onSettled: () => setPendingId(null) });
  };

  return (
    <div data-ocid="notifications.page">
      <PageHeader
        title="通知中心"
        description="到期提醒、核实与权限变更通知"
        actions={
          <Button
            type="button"
            variant="outline"
            data-ocid="notifications.mark_all_button"
            disabled={!hasUnread || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            {markAll.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCheck className="size-4" aria-hidden="true" />
            )}
            全部标为已读
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span
          data-ocid="notifications.unread_count"
          className="num-tabular inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground shadow-subtle"
        >
          <span
            className={
              hasUnread
                ? "size-1.5 rounded-full bg-primary"
                : "size-1.5 rounded-full bg-muted-foreground/40"
            }
            aria-hidden="true"
          />
          未读 {unreadCount.toString()} 条
        </span>
        <span className="num-tabular text-xs text-muted-foreground">
          共 {list.length} 条通知
        </span>
      </div>

      {notifications.isLoading ? (
        <LoadingState rows={4} label="正在加载通知…" />
      ) : notifications.isError ? (
        <ErrorState
          message={describeError(notifications.error)}
          onRetry={() => void notifications.refetch()}
        />
      ) : list.length === 0 ? (
        <EmptyState
          title="暂无通知"
          description="当证照临近到期、档案被核实或权限发生变更时，通知会显示在这里。"
          icon={<BellOff className="size-5" aria-hidden="true" />}
        />
      ) : (
        <ul data-ocid="notifications.list" className="space-y-2.5">
          {list.map((notification, index) => (
            <NotificationItem
              key={notification.id.toString()}
              notification={notification}
              index={index + 1}
              onMarkRead={handleMarkRead}
              marking={pendingId === notification.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
