import type { CheckItemKind, ClauseKind } from "@/backend";
import {
  CheckItemKind as CheckItemKindEnum,
  ClauseKind as ClauseKindEnum,
} from "@/backend";
import {
  CHECK_ITEM_KIND_LABELS,
  CHECK_ITEM_KIND_ORDER,
  CLAUSE_KIND_LABELS,
  CLAUSE_KIND_ORDER,
} from "@/lib/labels";
import {
  BadgeCheck,
  Banknote,
  Building,
  FileText,
  Landmark,
  Users,
} from "lucide-react";

export interface KindOption<K extends string> {
  value: K;
  label: string;
  icon: typeof FileText;
}

/** Display config for 核对项类别 (check item kinds). */
export const CHECK_ITEM_KIND_OPTIONS: KindOption<CheckItemKind>[] =
  CHECK_ITEM_KIND_ORDER.map((kind) => ({
    value: kind,
    label: CHECK_ITEM_KIND_LABELS[kind],
    icon: CHECK_ITEM_KIND_ICONS[kind],
  }));

const CHECK_ITEM_KIND_ICONS: Record<CheckItemKind, typeof FileText> = {
  [CheckItemKindEnum.qualification]: BadgeCheck,
  [CheckItemKindEnum.performance]: FileText,
  [CheckItemKindEnum.personnel]: Users,
  [CheckItemKindEnum.capital]: Landmark,
  [CheckItemKindEnum.deposit]: Banknote,
  [CheckItemKindEnum.other]: Building,
};

/** Display config for 条款类别 (clause kinds). */
export const CLAUSE_KIND_OPTIONS: KindOption<ClauseKind>[] =
  CLAUSE_KIND_ORDER.map((kind) => ({
    value: kind,
    label: CLAUSE_KIND_LABELS[kind],
    icon: CLAUSE_KIND_ICONS[kind],
  }));

const CLAUSE_KIND_ICONS: Record<ClauseKind, typeof FileText> = {
  [ClauseKindEnum.qualification]: BadgeCheck,
  [ClauseKindEnum.performance]: FileText,
  [ClauseKindEnum.personnel]: Users,
  [ClauseKindEnum.deposit]: Banknote,
};

export function checkItemKindLabel(kind: CheckItemKind): string {
  return CHECK_ITEM_KIND_LABELS[kind];
}

export function clauseKindLabel(kind: ClauseKind): string {
  return CLAUSE_KIND_LABELS[kind];
}
