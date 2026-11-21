import { AccountRole, ApprovalState } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { APPROVAL_LABELS, ROLE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import {
  CircleCheck,
  CircleDot,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

const APPROVAL_STYLES: Record<ApprovalState, string> = {
  [ApprovalState.pending]:
    "bg-status-pending-soft text-status-pending-foreground border-status-pending-border",
  [ApprovalState.approved]:
    "bg-status-verified-soft text-status-verified-foreground border-status-verified-border",
  [ApprovalState.rejected]:
    "bg-status-expired-soft text-status-expired-foreground border-status-expired-border",
};

const APPROVAL_ICONS: Record<ApprovalState, typeof CircleDot> = {
  [ApprovalState.pending]: CircleDot,
  [ApprovalState.approved]: CircleCheck,
  [ApprovalState.rejected]: XCircle,
};

export function ApprovalBadge({
  approval,
  className,
}: {
  approval: ApprovalState;
  className?: string;
}) {
  const Icon = APPROVAL_ICONS[approval];
  return (
    <Badge
      variant="outline"
      data-ocid="users.approval_badge"
      className={cn(
        "gap-1 rounded-sm px-1.5 py-0.5 font-medium",
        APPROVAL_STYLES[approval],
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {APPROVAL_LABELS[approval]}
    </Badge>
  );
}

export function RoleBadge({
  role,
  className,
}: {
  role: AccountRole;
  className?: string;
}) {
  const isAdmin = role === AccountRole.admin;
  const Icon = isAdmin ? ShieldCheck : User;
  return (
    <Badge
      variant="outline"
      data-ocid="users.role_badge"
      className={cn(
        "gap-1 rounded-sm px-1.5 py-0.5 font-medium",
        isAdmin
          ? "border-primary/30 bg-accent text-accent-foreground"
          : "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {ROLE_LABELS[role]}
    </Badge>
  );
}
