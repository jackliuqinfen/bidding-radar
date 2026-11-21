import type { OpportunityFilter, ProjectType, SortField } from "@/backend";
import {
  OpportunityStatus as OpportunityStatusEnum,
  ProjectType as ProjectTypeEnum,
  SortField as SortFieldEnum,
} from "@/backend";
import { dateInputToTimestamp } from "@/lib/format";

/** Search params accepted by the /opportunities route; every key is required. */
export interface OpportunitySearch {
  projectType: string | undefined;
  status: string | undefined;
  deadlineFrom: string | undefined;
  deadlineTo: string | undefined;
  keyword: string | undefined;
  sortBy: string | undefined;
  descending: string | undefined;
}

const PROJECT_TYPES = new Set<string>(Object.values(ProjectTypeEnum));
const STATUSES = new Set<string>(Object.values(OpportunityStatusEnum));
const SORT_FIELDS = new Set<string>(Object.values(SortFieldEnum));

function pick(value: unknown, allowed: Set<string>): string | undefined {
  return typeof value === "string" && allowed.has(value) ? value : undefined;
}

function pickDate(value: unknown): string | undefined {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : undefined;
}

/** Normalises raw URL search into the typed opportunity filter shape. */
export function parseOpportunitySearch(
  search: Record<string, unknown>,
): OpportunitySearch {
  return {
    projectType: pick(search.projectType, PROJECT_TYPES),
    status: pick(search.status, STATUSES),
    deadlineFrom: pickDate(search.deadlineFrom),
    deadlineTo: pickDate(search.deadlineTo),
    keyword:
      typeof search.keyword === "string" && search.keyword.trim()
        ? search.keyword
        : undefined,
    sortBy: pick(search.sortBy, SORT_FIELDS),
    descending:
      search.descending === "true" || search.descending === "false"
        ? search.descending
        : undefined,
  };
}

/**
 * Builds a complete /opportunities search object from a partial filter.
 * Returned as a reducer so TanStack Router accepts every required key.
 */
export function opportunitySearch(partial: Partial<OpportunitySearch> = {}) {
  return (): OpportunitySearch => ({
    projectType: partial.projectType,
    status: partial.status,
    deadlineFrom: partial.deadlineFrom,
    deadlineTo: partial.deadlineTo,
    keyword: partial.keyword,
    sortBy: partial.sortBy,
    descending: partial.descending,
  });
}

/** Maps URL search params onto the backend OpportunityFilter contract. */
export function toOpportunityFilter(
  search: OpportunitySearch,
): OpportunityFilter {
  const deadlineFrom = dateInputToTimestamp(search.deadlineFrom ?? "");
  const deadlineTo = dateInputToTimestamp(search.deadlineTo ?? "");
  const keyword = search.keyword?.trim();
  return {
    projectType: search.projectType as ProjectType | undefined,
    status: search.status as OpportunityFilter["status"],
    deadlineFrom,
    deadlineTo,
    search: keyword ? keyword : undefined,
    sortBy: (search.sortBy as SortField | undefined) ?? SortFieldEnum.deadline,
    descending: search.descending === "true",
  };
}
