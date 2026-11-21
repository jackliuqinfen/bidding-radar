import { RecordKind } from "@/backend";
import type { RecordView } from "@/backend";
import { PageHeader } from "@/components/common/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/common/States";
import { CompanyGroup } from "@/components/personnel/CompanyGroup";
import { CreatePersonDialog } from "@/components/personnel/CreatePersonDialog";
import { useMyAccess } from "@/components/personnel/usePersonnel";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanies } from "@/hooks/useCompanies";
import { useRecords } from "@/hooks/useRecords";
import { describeError } from "@/lib/errors";
import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

const ALL = "__all__";

export default function PersonnelPage() {
  const companies = useCompanies();
  const people = useRecords({ kind: RecordKind.person });
  const { accessFor } = useMyAccess();

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>(ALL);
  const [createFor, setCreateFor] = useState<bigint | null>(null);

  const companyList = companies.data ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (people.data ?? []).filter((person) => {
      if (
        companyFilter !== ALL &&
        person.companyId.toString() !== companyFilter
      ) {
        return false;
      }
      if (!term) return true;
      const data =
        person.data.__kind__ === "person" ? person.data.person : null;
      return (
        person.title.toLowerCase().includes(term) ||
        (data?.position ?? "").toLowerCase().includes(term) ||
        person.maintainerName.toLowerCase().includes(term)
      );
    });
  }, [people.data, search, companyFilter]);

  const groups = useMemo(() => {
    const map = new Map<string, { companyId: bigint; people: RecordView[] }>();
    for (const person of filtered) {
      const key = person.companyId.toString();
      const existing = map.get(key);
      if (existing) {
        existing.people.push(person);
      } else {
        map.set(key, { companyId: person.companyId, people: [person] });
      }
    }
    const nameOf = (companyId: bigint) =>
      companyList.find((c) => c.id === companyId)?.name ?? "未归属单位";
    return Array.from(map.values()).sort((a, b) =>
      nameOf(a.companyId).localeCompare(nameOf(b.companyId), "zh-CN"),
    );
  }, [filtered, companyList]);

  const isLoading = companies.isLoading || people.isLoading;
  const isError = companies.isError || people.isError;
  const errorMessage = companies.isError
    ? describeError(companies.error)
    : people.isError
      ? describeError(people.error)
      : "";

  const retry = () => {
    void companies.refetch();
    void people.refetch();
  };

  const createCompany = companyList.find((c) => c.id === createFor);

  return (
    <div data-ocid="personnel.page" className="space-y-4">
      <PageHeader
        title="人员档案"
        description="按单位查看人员基本信息、证书与业绩，身份证号默认脱敏。"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            data-ocid="personnel.search_input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索姓名、岗位或维护责任人"
            aria-label="搜索人员"
            className="pl-9"
          />
        </div>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger
            data-ocid="personnel.company.select"
            className="sm:w-56"
            aria-label="按单位筛选"
          >
            <SelectValue placeholder="全部单位" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>全部单位</SelectItem>
            {companyList.map((company) => (
              <SelectItem
                key={company.id.toString()}
                value={company.id.toString()}
              >
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState rows={4} label="正在加载人员档案…" />
      ) : isError ? (
        <ErrorState message={errorMessage} onRetry={retry} />
      ) : companyList.length === 0 ? (
        <EmptyState
          title="暂无单位"
          description="请先在「公司档案」中建立单位，再登记人员。"
          icon={<Users className="size-5" aria-hidden="true" />}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          title={
            search || companyFilter !== ALL ? "没有匹配的人员" : "暂无人员"
          }
          description={
            search || companyFilter !== ALL
              ? "调整搜索关键词或单位筛选后重试。"
              : "在下方单位中新增第一位人员。"
          }
          icon={<Users className="size-5" aria-hidden="true" />}
        />
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const company = companyList.find((c) => c.id === group.companyId);
            if (!company) return null;
            return (
              <CompanyGroup
                key={group.companyId.toString()}
                company={company}
                people={group.people}
                canEdit={accessFor(group.companyId).canEdit}
                onAdd={() => setCreateFor(group.companyId)}
              />
            );
          })}
        </div>
      )}

      {createCompany && (
        <CreatePersonDialog
          companyId={createCompany.id}
          companyName={createCompany.name}
          open={createFor !== null}
          onOpenChange={(open) => {
            if (!open) setCreateFor(null);
          }}
        />
      )}
    </div>
  );
}
