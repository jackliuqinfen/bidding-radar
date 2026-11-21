import type { AccountView, CompanyView, PermissionSet } from "@/backend";
import { ApprovalState } from "@/backend";
import { PageHeader } from "@/components/common/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { PermissionsPanel } from "@/components/users/PermissionsPanel";
import { UserActions } from "@/components/users/UserActions";
import { ApprovalBadge, RoleBadge } from "@/components/users/UserBadges";
import { useMyAccount } from "@/hooks/useAccount";
import { useAccounts, useUserPermissions } from "@/hooks/useAccounts";
import { useCompanies } from "@/hooks/useCompanies";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChevronDown, ShieldAlert, Users } from "lucide-react";
import { useState } from "react";

function PermissionDenied() {
  return (
    <div data-ocid="users.permission_denied_state">
      <PageHeader title="用户与权限" description="账号批准、角色与公司权限" />
      <EmptyState
        icon={<ShieldAlert className="size-5" aria-hidden="true" />}
        title="无权访问"
        description="用户与权限管理仅限管理员使用。如需相应权限，请联系管理员。"
      />
    </div>
  );
}

function grantsToMap(
  grants: { companyId: bigint; permissions: PermissionSet }[] | undefined,
): Map<string, PermissionSet> {
  const map = new Map<string, PermissionSet>();
  for (const grant of grants ?? []) {
    map.set(grant.companyId.toString(), grant.permissions);
  }
  return map;
}

function UserCard({
  account,
  companies,
  isSelf,
  index,
}: {
  account: AccountView;
  companies: CompanyView[];
  isSelf: boolean;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const permissions = useUserPermissions(
    open ? account.principal.toText() : undefined,
  );
  const grants = grantsToMap(permissions.data?.grants);

  return (
    <div
      data-ocid={`users.user_card.${index}`}
      className="rounded-lg border border-border bg-card shadow-subtle"
    >
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm font-semibold text-accent-foreground">
            {account.displayName.slice(0, 1)}
          </span>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">
                {account.displayName}
              </p>
              {isSelf && (
                <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  本人
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <ApprovalBadge approval={account.approval} />
              <RoleBadge role={account.role} />
              <span className="text-[11px] text-muted-foreground">
                注册于 {formatDate(account.registeredAt)}
              </span>
            </div>
          </div>
        </div>
        <UserActions
          account={account}
          isSelf={isSelf}
          className="md:shrink-0"
        />
      </div>

      {account.approval === ApprovalState.approved && (
        <div className="border-t border-border px-4 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            data-ocid={`users.permissions_toggle.${index}`}
            className="w-full justify-between px-1 text-muted-foreground hover:text-foreground md:w-auto"
          >
            <span className="text-xs font-medium">公司权限</span>
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                open && "rotate-180",
              )}
              aria-hidden="true"
            />
          </Button>

          {open && (
            <div className="pb-3 pt-1">
              {permissions.isLoading ? (
                <LoadingState rows={2} label="正在加载权限…" />
              ) : permissions.isError ? (
                <ErrorState
                  message="权限加载失败，请重试。"
                  onRetry={() => void permissions.refetch()}
                />
              ) : (
                <PermissionsPanel
                  user={account.principal.toText()}
                  companies={companies}
                  grants={grants}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  const myAccount = useMyAccount();
  const accounts = useAccounts();
  const companies = useCompanies();

  if (myAccount.isLoading) {
    return (
      <div data-ocid="users.page">
        <PageHeader title="用户与权限" description="账号批准、角色与公司权限" />
        <LoadingState rows={4} label="正在加载用户…" />
      </div>
    );
  }

  if (myAccount.data?.role !== "admin") {
    return <PermissionDenied />;
  }

  const selfPrincipal = myAccount.data.principal.toText();
  const list = accounts.data ?? [];
  const pending = list.filter((a) => a.approval === ApprovalState.pending);
  const others = list.filter(
    (a) =>
      a.approval !== ApprovalState.pending &&
      a.principal.toText() !== selfPrincipal,
  );

  return (
    <div data-ocid="users.page">
      <PageHeader
        title="用户与权限"
        description="批准账号、设置角色，并按公司分配查看、编辑、核实与敏感下载权限"
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
            <Users className="size-3.5" aria-hidden="true" />共 {list.length}{" "}
            个账号
            {pending.length > 0 && (
              <span className="ml-1 rounded-sm bg-status-pending-soft px-1.5 py-0.5 font-medium text-status-pending-foreground">
                {pending.length} 待批准
              </span>
            )}
          </span>
        }
      />

      {accounts.isLoading ? (
        <LoadingState rows={4} label="正在加载用户…" />
      ) : accounts.isError ? (
        <ErrorState
          message="用户列表加载失败，请重试。"
          onRetry={() => void accounts.refetch()}
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" aria-hidden="true" />}
          title="暂无账号"
          description="新用户注册后会出现在这里，等待管理员批准。"
        />
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <section data-ocid="users.pending_section" className="space-y-2">
              <h2 className="font-display text-sm font-semibold text-foreground">
                待批准
              </h2>
              <div className="space-y-2">
                {pending.map((account, index) => (
                  <UserCard
                    key={account.principal.toText()}
                    account={account}
                    companies={companies.data ?? []}
                    isSelf={account.principal.toText() === selfPrincipal}
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}

          <section data-ocid="users.list" className="space-y-2">
            <h2 className="font-display text-sm font-semibold text-foreground">
              全部账号
            </h2>
            {others.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                暂无已处理的账号。
              </p>
            ) : (
              <div className="space-y-2">
                {others.map((account, index) => (
                  <UserCard
                    key={account.principal.toText()}
                    account={account}
                    companies={companies.data ?? []}
                    isSelf={account.principal.toText() === selfPrincipal}
                    index={index}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
