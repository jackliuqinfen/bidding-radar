import type { AuditResult } from "@/backend";
import { AuditResult as AuditResultEnum } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { AUDIT_RESULT_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { CircleCheck, ShieldX } from "lucide-react";

const RESULT_STYLES: Record<AuditResult, string> = {
  [AuditResultEnum.success]:
    "bg-status-verified-soft text-status-verified-foreground border-status-verified-border",
  [AuditResultEnum.denied]:
    "bg-status-expired-soft text-status-expired-foreground border-status-expired-border",
};

const RESULT_ICONS: Record<AuditResult, typeof CircleCheck> = {
  [AuditResultEnum.success]: CircleCheck,
  [AuditResultEnum.denied]: ShieldX,
};

/** Result badge: icon + text so the outcome never relies on colour alone. */
export function AuditResultBadge({
  result,
  className,
}: {
  result: AuditResult;
  className?: string;
}) {
  const Icon = RESULT_ICONS[result];
  return (
    <Badge
      variant="outline"
      data-ocid="audit.result.badge"
      className={cn(
        "gap-1 rounded-sm px-1.5 py-0.5 font-medium",
        RESULT_STYLES[result],
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {AUDIT_RESULT_LABELS[result]}
    </Badge>
  );
}
