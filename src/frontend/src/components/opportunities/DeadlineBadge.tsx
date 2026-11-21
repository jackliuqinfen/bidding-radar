import { Badge } from "@/components/ui/badge";
import { isRegistrationClosed } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CalendarClock, TriangleAlert } from "lucide-react";

/**
 * Marks an announcement's registration deadline: 已截止 once the deadline
 * timestamp has passed, otherwise the remaining days (≤7 highlighted).
 */
export function DeadlineBadge({
  daysRemaining,
  registrationDeadline,
  className,
}: {
  daysRemaining: bigint;
  registrationDeadline: bigint;
  className?: string;
}) {
  const closed = isRegistrationClosed(registrationDeadline);
  const urgent = !closed && daysRemaining <= 7n;

  if (closed) {
    return (
      <Badge
        variant="outline"
        data-ocid="opportunity.deadline.badge"
        className={cn(
          "gap-1 rounded-sm border-status-expired-border bg-status-expired-soft px-1.5 py-0.5 font-medium text-status-expired-foreground",
          className,
        )}
      >
        <TriangleAlert className="size-3" aria-hidden="true" />
        已截止
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      data-ocid="opportunity.deadline.badge"
      className={cn(
        "gap-1 rounded-sm px-1.5 py-0.5 font-medium",
        urgent
          ? "border-status-expiring-border bg-status-expiring-soft text-status-expiring-foreground"
          : "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      <CalendarClock className="size-3" aria-hidden="true" />
      {daysRemaining === 0n ? "今日截止" : `剩余 ${daysRemaining} 天`}
    </Badge>
  );
}
