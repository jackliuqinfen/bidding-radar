import type { ExpiryFlag, RecordKind, RecordStatus } from "@/backend";
import {
  ExpiryFlag as ExpiryFlagEnum,
  RecordKind as RecordKindEnum,
  RecordStatus as RecordStatusEnum,
} from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EXPIRY_LABELS,
  KIND_LABELS,
  KIND_ORDER,
  STATUS_LABELS,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import { FilterX } from "lucide-react";

export interface GapFilterState {
  status?: RecordStatus;
  expiry?: ExpiryFlag;
  category?: string;
  owner?: string;
}

const ALL = "__all__";

const STATUS_OPTIONS = [
  RecordStatusEnum.missing,
  RecordStatusEnum.pendingReview,
  RecordStatusEnum.verified,
];

const EXPIRY_OPTIONS = [ExpiryFlagEnum.nearExpiry, ExpiryFlagEnum.expired];

function FilterField({
  label,
  value,
  onChange,
  placeholder,
  options,
  ocid,
}: {
  label: string;
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  ocid: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select
        value={value ?? ALL}
        onValueChange={(next) => onChange(next === ALL ? undefined : next)}
      >
        <SelectTrigger
          size="sm"
          aria-label={label}
          data-ocid={ocid}
          className="w-full min-w-0 bg-card text-sm"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Status / expiry / category / maintainer filters for one company's gap list. */
export function GapFilterBar({
  value,
  onChange,
  owners,
  className,
}: {
  value: GapFilterState;
  onChange: (next: GapFilterState) => void;
  owners: string[];
  className?: string;
}) {
  const activeCount = [
    value.status,
    value.expiry,
    value.category,
    value.owner,
  ].filter(Boolean).length;

  return (
    <div
      data-ocid="dashboard.filter.panel"
      className={cn(
        "rounded-lg border border-border bg-card p-3 shadow-subtle",
        className,
      )}
    >
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <FilterField
          label="档案状态"
          value={value.status}
          onChange={(status) =>
            onChange({ ...value, status: status as RecordStatus | undefined })
          }
          placeholder="全部状态"
          ocid="dashboard.filter.status_select"
          options={STATUS_OPTIONS.map((s) => ({
            value: s,
            label: STATUS_LABELS[s],
          }))}
        />
        <FilterField
          label="到期标记"
          value={value.expiry}
          onChange={(expiry) =>
            onChange({ ...value, expiry: expiry as ExpiryFlag | undefined })
          }
          placeholder="全部到期情况"
          ocid="dashboard.filter.expiry_select"
          options={EXPIRY_OPTIONS.map((e) => ({
            value: e,
            label: EXPIRY_LABELS[e],
          }))}
        />
        <FilterField
          label="档案类别"
          value={value.category}
          onChange={(category) => onChange({ ...value, category })}
          placeholder="全部类别"
          ocid="dashboard.filter.category_select"
          options={KIND_ORDER.map((kind: RecordKind) => ({
            value: kind,
            label: KIND_LABELS[kind],
          }))}
        />
        <FilterField
          label="维护责任人"
          value={value.owner}
          onChange={(owner) => onChange({ ...value, owner })}
          placeholder="全部责任人"
          ocid="dashboard.filter.owner_select"
          options={owners.map((name) => ({ value: name, label: name }))}
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {activeCount === 0
            ? "未筛选，显示该公司全部档案"
            : `已启用 ${activeCount} 项筛选`}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={activeCount === 0}
          data-ocid="dashboard.filter.clear_button"
          onClick={() => onChange({})}
        >
          <FilterX className="size-3.5" aria-hidden="true" />
          清除筛选
        </Button>
      </div>
    </div>
  );
}
