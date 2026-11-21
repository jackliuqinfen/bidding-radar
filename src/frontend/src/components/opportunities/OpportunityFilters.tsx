import type { OpportunityStatus, ProjectType, SortField } from "@/backend";
import {
  OpportunityStatus as OpportunityStatusEnum,
  ProjectType as ProjectTypeEnum,
  SortField as SortFieldEnum,
} from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_STATUS_ORDER,
  PROJECT_TYPE_LABELS,
  SORT_FIELD_LABELS,
  SORT_FIELD_ORDER,
} from "@/lib/labels";
import type { OpportunitySearch } from "@/lib/opportunitySearch";
import { cn } from "@/lib/utils";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  RotateCcw,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

const ALL = "__all__";

const PROJECT_TYPE_OPTIONS = Object.values(ProjectTypeEnum);
const STATUS_OPTIONS = OPPORTUNITY_STATUS_ORDER;

/**
 * Filter bar for the opportunity pool. Every change is written to the URL
 * search so a refresh or shared link restores the same view.
 */
export function OpportunityFilters({
  search,
  onChange,
  onReset,
  activeCount,
}: {
  search: OpportunitySearch;
  onChange: (next: Partial<OpportunitySearch>) => void;
  onReset: () => void;
  activeCount: number;
}) {
  const [keyword, setKeyword] = useState(search.keyword ?? "");

  useEffect(() => {
    setKeyword(search.keyword ?? "");
  }, [search.keyword]);

  const submitKeyword = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = keyword.trim();
    onChange({ keyword: trimmed ? trimmed : undefined });
  };

  const sortBy =
    (search.sortBy as SortField | undefined) ?? SortFieldEnum.deadline;
  const descending = search.descending === "true";

  return (
    <section
      data-ocid="opportunities.filters.section"
      aria-label="筛选公告"
      className="rounded-lg border border-border bg-card p-3 shadow-subtle md:p-4"
    >
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <form onSubmit={submitKeyword} className="space-y-1.5 lg:col-span-2">
          <Label
            htmlFor="opportunity-keyword"
            className="text-xs text-muted-foreground"
          >
            关键词
          </Label>
          <div className="flex gap-2">
            <Input
              id="opportunity-keyword"
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="项目名称或招标人"
              data-ocid="opportunities.filters.search_input"
              className="h-9"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              data-ocid="opportunities.filters.search_button"
              className="h-9 shrink-0"
            >
              搜索
            </Button>
          </div>
        </form>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">项目类型</Label>
          <Select
            value={search.projectType ?? ALL}
            onValueChange={(value) =>
              onChange({
                projectType: value === ALL ? undefined : (value as ProjectType),
              })
            }
          >
            <SelectTrigger
              data-ocid="opportunities.filters.project_type.select"
              className="h-9"
              aria-label="按项目类型筛选"
            >
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全部类型</SelectItem>
              {PROJECT_TYPE_OPTIONS.map((type) => (
                <SelectItem key={type} value={type}>
                  {PROJECT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">状态</Label>
          <Select
            value={search.status ?? ALL}
            onValueChange={(value) =>
              onChange({
                status:
                  value === ALL ? undefined : (value as OpportunityStatus),
              })
            }
          >
            <SelectTrigger
              data-ocid="opportunities.filters.status.select"
              className="h-9"
              aria-label="按状态筛选"
            >
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>全部状态</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {OPPORTUNITY_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="opportunity-deadline-from"
            className="text-xs text-muted-foreground"
          >
            报名截止（起）
          </Label>
          <Input
            id="opportunity-deadline-from"
            type="date"
            value={search.deadlineFrom ?? ""}
            data-ocid="opportunities.filters.deadline_from.input"
            className="h-9"
            onChange={(e) =>
              onChange({ deadlineFrom: e.target.value || undefined })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="opportunity-deadline-to"
            className="text-xs text-muted-foreground"
          >
            报名截止（止）
          </Label>
          <Input
            id="opportunity-deadline-to"
            type="date"
            value={search.deadlineTo ?? ""}
            data-ocid="opportunities.filters.deadline_to.input"
            className="h-9"
            onChange={(e) =>
              onChange({ deadlineTo: e.target.value || undefined })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">排序</Label>
          <div className="flex gap-2">
            <Select
              value={sortBy}
              onValueChange={(value) =>
                onChange({ sortBy: value as SortField })
              }
            >
              <SelectTrigger
                data-ocid="opportunities.filters.sort.select"
                className="h-9 flex-1"
                aria-label="排序字段"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_FIELD_ORDER.map((field) => (
                  <SelectItem key={field} value={field}>
                    {SORT_FIELD_LABELS[field]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              data-ocid="opportunities.filters.sort_direction.toggle"
              aria-label={
                descending ? "当前降序，切换为升序" : "当前升序，切换为降序"
              }
              aria-pressed={descending}
              className="size-9 shrink-0"
              onClick={() =>
                onChange({ descending: descending ? "false" : "true" })
              }
            >
              {descending ? (
                <ArrowDownWideNarrow className="size-4" aria-hidden="true" />
              ) : (
                <ArrowUpNarrowWide className="size-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          {activeCount > 0 ? `已应用 ${activeCount} 项筛选` : "未应用筛选"}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-ocid="opportunities.filters.reset_button"
          disabled={activeCount === 0}
          onClick={onReset}
          className={cn("h-8", activeCount === 0 && "opacity-50")}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          重置筛选
        </Button>
      </div>
    </section>
  );
}
