import type { ExpiryFlag, RecordStatus } from "@/backend";
import {
  ExpiryFlag as ExpiryFlagEnum,
  RecordStatus as RecordStatusEnum,
} from "@/backend";
import { Badge } from "@/components/ui/badge";
import { EXPIRY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import {
  Circle,
  CircleCheck,
  CircleDot,
  Clock,
  TriangleAlert,
} from "lucide-react";

const STATUS_STYLES: Record<RecordStatus, string> = {
  [RecordStatusEnum.missing]:
    "bg-status-missing-soft text-status-missing-foreground border-status-missing-border",
  [RecordStatusEnum.pendingReview]:
    "bg-status-pending-soft text-status-pending-foreground border-status-pending-border",
  [RecordStatusEnum.verified]:
    "bg-status-verified-soft text-status-verified-foreground border-status-verified-border",
};

const STATUS_ICONS: Record<RecordStatus, typeof Circle> = {
  [RecordStatusEnum.missing]: Circle,
  [RecordStatusEnum.pendingReview]: CircleDot,
  [RecordStatusEnum.verified]: CircleCheck,
};

const EXPIRY_STYLES: Record<ExpiryFlag, string> = {
  [ExpiryFlagEnum.nearExpiry]:
    "bg-status-expiring-soft text-status-expiring-foreground border-status-expiring-border",
  [ExpiryFlagEnum.expired]:
    "bg-status-expired-soft text-status-expired-foreground border-status-expired-border",
};

const EXPIRY_ICONS: Record<ExpiryFlag, typeof Clock> = {
  [ExpiryFlagEnum.nearExpiry]: Clock,
  [ExpiryFlagEnum.expired]: TriangleAlert,
};

export function StatusBadge({
  status,
  className,
}: {
  status: RecordStatus;
  className?: string;
}) {
  const Icon = STATUS_ICONS[status];
  return (
    <Badge
      variant="outline"
      data-ocid="status.badge"
      className={cn(
        "rounded-sm gap-1 px-1.5 py-0.5 font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function ExpiryBadge({
  flag,
  className,
}: {
  flag: ExpiryFlag;
  className?: string;
}) {
  const Icon = EXPIRY_ICONS[flag];
  return (
    <Badge
      variant="outline"
      data-ocid="expiry.badge"
      className={cn(
        "rounded-sm gap-1 px-1.5 py-0.5 font-medium",
        EXPIRY_STYLES[flag],
        flag === ExpiryFlagEnum.expired && "border-solid",
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {EXPIRY_LABELS[flag]}
    </Badge>
  );
}

/** Status badge plus an optional expiry flag badge. */
export function RecordBadges({
  status,
  expiryFlag,
  className,
}: {
  status: RecordStatus;
  expiryFlag?: ExpiryFlag;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <StatusBadge status={status} />
      {expiryFlag && <ExpiryBadge flag={expiryFlag} />}
    </div>
  );
}
