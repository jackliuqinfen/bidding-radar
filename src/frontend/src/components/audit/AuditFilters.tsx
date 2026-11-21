import type { AuditAction, AuditResult, CompanyView } from "@/backend";
import { AuditResult as AuditResultEnum } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUDIT_ACTION_LABELS, AUDIT_RESULT_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { FilterX } from "lucide-react";

export interface AuditFilterState {
  operator: string;
  action: AuditAction | "all";
  result: AuditResult | "all";
  company: string;
}

export const EMPTY_AUDIT_FILTERS: AuditFilterState = {
  operator: "all",
  action: "all",
  result: "all",
  company: "all",
};

const ALL = "all";

const ACTION_OPTIONS = Object.entries(AUDIT_ACTION_LABELS) as [
  AuditAction,
  string,
][];

const RESULT_OPTIONS = Object.entries(AUDIT_RESULT_LABELS) as [
  AuditResult,
  string,
][];

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export function AuditFilters({
  value,
  onChange,
  operators,
  companies,
  className,
}: {
  value: AuditFilterState;
  onChange: (next: AuditFilterState) => void;
  operators: { principal: string; name: string }[];
  companies: CompanyView[];
  className?: string;
}) {
  const isFiltered =
    value.operator !== ALL ||
    value.action !== ALL ||
    value.result !== ALL ||
    value.company !== ALL;

  return (
    <div
      data-ocid="audit.filters"
      className={cn(
        "grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-3 shadow-subtle sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end",
        className,
      )}
    >
      <FilterField label="操作人">
        <Select
          value={value.operator}
          onValueChange={(next) => onChange({ ...value, operator: next })}
        >
          <SelectTrigger
            data-ocid="audit.filter.operator.select"
            className="w-full"
            aria-label="按操作人筛选"
          >
            <SelectValue placeholder="全部操作人" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>全部操作人</SelectItem>
            {operators.map((op) => (
              <SelectItem key={op.principal} value={op.principal}>
                {op.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="操作类型">
        <Select
          value={value.action}
          onValueChange={(next) =>
            onChange({ ...value, action: next as AuditAction | "all" })
          }
        >
          <SelectTrigger
            data-ocid="audit.filter.action.select"
            className="w-full"
            aria-label="按操作类型筛选"
          >
            <SelectValue placeholder="全部操作" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>全部操作</SelectItem>
            {ACTION_OPTIONS.map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="结果">
        <Select
          value={value.result}
          onValueChange={(next) =>
            onChange({ ...value, result: next as AuditResult | "all" })
          }
        >
          <SelectTrigger
            data-ocid="audit.filter.result.select"
            className="w-full"
            aria-label="按结果筛选"
          >
            <SelectValue placeholder="全部结果" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>全部结果</SelectItem>
            {RESULT_OPTIONS.map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="公司">
        <Select
          value={value.company}
          onValueChange={(next) => onChange({ ...value, company: next })}
        >
          <SelectTrigger
            data-ocid="audit.filter.company.select"
            className="w-full"
            aria-label="按公司筛选"
          >
            <SelectValue placeholder="全部公司" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>全部公司</SelectItem>
            {companies.map((company) => (
              <SelectItem
                key={company.id.toString()}
                value={company.id.toString()}
              >
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <Button
        type="button"
        variant="ghost"
        data-ocid="audit.filter.reset_button"
        onClick={() => onChange(EMPTY_AUDIT_FILTERS)}
        disabled={!isFiltered}
        className="justify-self-start lg:justify-self-auto"
      >
        <FilterX className="size-4" aria-hidden="true" />
        清除筛选
      </Button>
    </div>
  );
}

export { ALL as AUDIT_FILTER_ALL };
