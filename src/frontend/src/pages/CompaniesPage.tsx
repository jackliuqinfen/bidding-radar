import type { CompanyView } from "@/backend";
import { PageHeader } from "@/components/common/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/common/States";
import { CompanyFormDialog } from "@/components/companies/CompanyFormDialog";
import { Button } from "@/components/ui/button";
import { useMyAccount } from "@/hooks/useAccount";
import { useCompanies } from "@/hooks/useCompanies";
import { useMyPermissions } from "@/hooks/usePermissions";
import { describeError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Building2, ChevronRight, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

export default function CompaniesPage() {
  const companies = useCompanies();
  const account = useMyAccount();
  const permissions = useMyPermissions();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyView | undefined>(undefined);

  const isAdmin = account.data?.role === "admin";
  const editableCompanyIds = useMemo(() => {
    const ids = new Set<string>();
    for (const grant of permissions.data ?? []) {
      if (grant.permissions.edit) ids.add(grant.companyId.toString());
    }
    return ids;
  }, [permissions.data]);

  const canEdit = (company: CompanyView) =>
    isAdmin || editableCompanyIds.has(company.id.toString());

  const filtered = useMemo(() => {
    const list = companies.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.creditCode.toLowerCase().includes(term) ||
        c.maintainerName.toLowerCase().includes(term),
    );
  }, [companies.data, search]);

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (company: CompanyView) => {
    setEditing(company);
    setDialogOpen(true);
  };

  const total = companies.data?.length ?? 0;

  return (
    <div data-ocid="companies.page">
      <PageHeader
        title="公司档案"
        description="集团各成员公司的证照资质与企业业绩档案"
        actions={
          isAdmin ? (
            <Button
              type="button"
              data-ocid="companies.create_button"
              onClick={openCreate}
            >
              <Plus className="size-4" aria-hidden="true" />
              新建公司
            </Button>
          ) : undefined
        }
      />

      {companies.isLoading ? (
        <LoadingState rows={4} label="正在加载公司列表…" />
      ) : companies.isError ? (
        <ErrorState
          message={describeError(companies.error)}
          onRetry={() => void companies.refetch()}
        />
      ) : total === 0 ? (
        <EmptyState
          title="还没有公司档案"
          description={
            isAdmin
              ? "先登记集团成员公司，再为其补充证照资质与企业业绩。"
              : "管理员尚未登记公司档案。"
          }
          icon={<Building2 className="size-5" aria-hidden="true" />}
          action={
            isAdmin ? (
              <Button
                type="button"
                data-ocid="companies.empty_state.create_button"
                onClick={openCreate}
              >
                <Plus className="size-4" aria-hidden="true" />
                新建公司
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索公司名称、信用代码或责任人"
                aria-label="搜索公司"
                data-ocid="companies.search_input"
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm text-foreground shadow-xs outline-none transition-smooth",
                  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              共 {total} 家公司
              {search.trim() && ` · 匹配 ${filtered.length} 家`}
            </p>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="没有匹配的公司"
              description="换个关键词试试，或清空搜索查看全部公司。"
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid="companies.search.clear_button"
                  onClick={() => setSearch("")}
                >
                  清空搜索
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
              <div className="hidden items-center gap-3 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground md:flex">
                <span className="flex-1">公司名称</span>
                <span className="w-56">统一社会信用代码</span>
                <span className="w-28">维护责任人</span>
                <span className="w-24">登记日期</span>
                <span className="w-14" />
              </div>
              <ul data-ocid="companies.list">
                {filtered.map((company, index) => (
                  <li
                    key={company.id.toString()}
                    data-ocid={`companies.list.item.${index + 1}`}
                    className="group flex items-center gap-2 border-b border-border px-4 py-3 last:border-b-0 hover:bg-accent/40 md:gap-3"
                  >
                    <Link
                      to="/companies/$companyId"
                      params={{ companyId: company.id.toString() }}
                      data-ocid={`companies.list.link.${index + 1}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary md:size-8">
                        <Building2 className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {company.name}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground md:hidden">
                          <span className="font-mono tracking-tight">
                            {company.creditCode}
                          </span>
                          <span>维护责任人 {company.maintainerName}</span>
                        </span>
                      </span>
                      <span className="hidden w-56 truncate font-mono text-xs text-muted-foreground md:block">
                        {company.creditCode}
                      </span>
                      <span className="hidden w-28 truncate text-sm text-foreground md:block">
                        {company.maintainerName}
                      </span>
                      <span className="hidden w-24 text-xs text-muted-foreground md:block">
                        {formatDate(company.createdAt)}
                      </span>
                    </Link>
                    <span className="flex w-14 shrink-0 justify-end">
                      {canEdit(company) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          data-ocid={`companies.list.edit_button.${index + 1}`}
                          onClick={() => openEdit(company)}
                        >
                          编辑
                        </Button>
                      ) : (
                        <ChevronRight
                          className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {isAdmin && account.data && (
        <CompanyFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          company={editing}
          maintainer={account.data.principal.toText()}
        />
      )}
    </div>
  );
}
