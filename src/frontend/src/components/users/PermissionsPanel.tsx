import type { CompanyView, PermissionSet } from "@/backend";
import type { Permission } from "@/backend";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSetUserCompanyPermissions } from "@/hooks/useCompanyMutations";
import { describeError } from "@/lib/errors";
import { PERMISSION_LABELS, PERMISSION_ORDER } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Building2, Info, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EMPTY_PERMISSIONS, isSamePermissions } from "./UserActions";

/** One company row: four independent permission switches plus a save action. */
function CompanyPermissionRow({
  user,
  company,
  initial,
  index,
}: {
  user: string;
  company: CompanyView;
  initial: PermissionSet;
  index: number;
}) {
  const save = useSetUserCompanyPermissions();
  const [draft, setDraft] = useState<PermissionSet>(initial);
  const dirty = !isSamePermissions(draft, initial);

  const toggle = (permission: Permission, checked: boolean) => {
    setDraft((current) => ({ ...current, [permission]: checked }));
  };

  const handleSave = () => {
    save.mutate(
      { user, companyId: company.id, permissions: draft },
      {
        onSuccess: () => {
          toast.success(`已保存「${company.name}」的权限`);
        },
        onError: (error) => {
          toast.error(describeError(error));
        },
      },
    );
  };

  return (
    <div
      data-ocid={`users.permission_row.${index}`}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card px-3 py-3 md:flex-row md:items-center md:justify-between md:gap-4"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Building2 className="size-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {company.name}
          </p>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            {company.creditCode}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:justify-end">
        {PERMISSION_ORDER.map((permission) => {
          const id = `perm-${company.id.toString()}-${permission}`;
          return (
            <label
              key={permission}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2 text-xs text-foreground"
            >
              <Switch
                id={id}
                checked={draft[permission]}
                onCheckedChange={(checked) => toggle(permission, checked)}
                disabled={save.isPending}
                data-ocid={`users.permission_switch.${index}.${permission}`}
                aria-label={`${company.name} ${PERMISSION_LABELS[permission]}`}
              />
              <span className="select-none">
                {PERMISSION_LABELS[permission]}
              </span>
            </label>
          );
        })}
        <Button
          type="button"
          size="sm"
          variant={dirty ? "default" : "outline"}
          disabled={!dirty || save.isPending}
          onClick={handleSave}
          data-ocid={`users.permission_save_button.${index}`}
          className="ml-auto md:ml-2"
        >
          {save.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-3.5" aria-hidden="true" />
          )}
          {save.isPending ? "保存中…" : "保存"}
        </Button>
      </div>
    </div>
  );
}

export function PermissionsPanel({
  user,
  companies,
  grants,
  className,
}: {
  user: string;
  companies: CompanyView[];
  grants: Map<string, PermissionSet>;
  className?: string;
}) {
  return (
    <div
      data-ocid="users.permissions_panel"
      className={cn("space-y-3", className)}
    >
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <p>
          管理员与维护责任人身份不自动附带任何公司权限，包括敏感下载；每项权限需在此单独授予。
        </p>
      </div>

      {companies.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          暂无公司，创建公司后可在此分配权限。
        </p>
      ) : (
        <div className="space-y-2">
          {companies.map((company, index) => (
            <CompanyPermissionRow
              key={company.id.toString()}
              user={user}
              company={company}
              initial={grants.get(company.id.toString()) ?? EMPTY_PERMISSIONS}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
