import type { OpportunityStatus } from "@/backend";
import { OpportunityStatus as OpportunityStatusEnum } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Ban, type Circle, CircleCheck, CircleDot, Clock } from "lucide-react";

const STATUS_STYLES: Record<OpportunityStatus, string> = {
  [OpportunityStatusEnum.pendingReview]:
    "bg-status-pending-soft text-status-pending-foreground border-status-pending-border",
  [OpportunityStatusEnum.selected]:
    "bg-status-verified-soft text-status-verified-foreground border-status-verified-border",
  [OpportunityStatusEnum.declined]:
    "bg-muted text-muted-foreground border-border",
  [OpportunityStatusEnum.closed]:
    "bg-status-expired-soft text-status-expired-foreground border-status-expired-border",
};

const STATUS_ICONS: Record<OpportunityStatus, typeof Circle> = {
  [OpportunityStatusEnum.pendingReview]: CircleDot,
  [OpportunityStatusEnum.selected]: CircleCheck,
  [OpportunityStatusEnum.declined]: Ban,
  [OpportunityStatusEnum.closed]: Clock,
};

export function OpportunityStatusBadge({
  status,
  className,
}: {
  status: OpportunityStatus;
  className?: string;
}) {
  const Icon = STATUS_ICONS[status];
  return (
    <Badge
      variant="outline"
      data-ocid="opportunity.status.badge"
      className={cn(
        "gap-1 rounded-sm px-1.5 py-0.5 font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {OPPORTUNITY_STATUS_LABELS[status]}
    </Badge>
  );
}
