import type { GapCounts } from "@/backend";
import { ExpiryFlag, RecordStatus } from "@/backend";
import { EXPIRY_LABELS, STATUS_LABELS } from "@/lib/labels";

export type CountKey =
  | "missing"
  | "pendingReview"
  | "verified"
  | "nearExpiry"
  | "expired";

export interface CountMeta {
  key: CountKey;
  label: string;
  /** Tailwind classes for the count chip, drawn from the status token system. */
  chip: string;
  dot: string;
}

/** The five gap metrics, in the canonical order the dashboard always shows. */
export const COUNT_META: CountMeta[] = [
  {
    key: "missing",
    label: STATUS_LABELS[RecordStatus.missing],
    chip: "bg-status-missing-soft text-status-missing-foreground border-status-missing-border",
    dot: "bg-status-missing",
  },
  {
    key: "pendingReview",
    label: STATUS_LABELS[RecordStatus.pendingReview],
    chip: "bg-status-pending-soft text-status-pending-foreground border-status-pending-border",
    dot: "bg-status-pending",
  },
  {
    key: "verified",
    label: STATUS_LABELS[RecordStatus.verified],
    chip: "bg-status-verified-soft text-status-verified-foreground border-status-verified-border",
    dot: "bg-status-verified",
  },
  {
    key: "nearExpiry",
    label: EXPIRY_LABELS[ExpiryFlag.nearExpiry],
    chip: "bg-status-expiring-soft text-status-expiring-foreground border-status-expiring-border",
    dot: "bg-status-expiring",
  },
  {
    key: "expired",
    label: EXPIRY_LABELS[ExpiryFlag.expired],
    chip: "bg-status-expired-soft text-status-expired-foreground border-status-expired-border",
    dot: "bg-status-expired",
  },
];

export function countValue(counts: GapCounts, key: CountKey): bigint {
  return counts[key];
}

/** Total records behind a company's counts (status buckets are mutually exclusive). */
export function totalRecords(counts: GapCounts): bigint {
  return counts.missing + counts.pendingReview + counts.verified;
}

/** Records that need attention: 待补 + 待核 + 已过期. */
export function attentionCount(counts: GapCounts): bigint {
  return counts.missing + counts.pendingReview + counts.expired;
}
