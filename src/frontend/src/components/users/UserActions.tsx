import type { AccountView, PermissionSet } from "@/backend";
import { AccountRole, ApprovalState } from "@/backend";
import { PermissionButton } from "@/components/common/PermissionButton";
import {
  useApproveAccount,
  useRejectAccount,
} from "@/hooks/useAccountMutations";
import { describeError } from "@/lib/errors";
import { ROLE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Check, ShieldCheck, User, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/** Approve / reject a pending account, or switch an approved account's role. */
export function UserActions({
  account,
  isSelf,
  className,
}: {
  account: AccountView;
  isSelf: boolean;
  className?: string;
}) {
  const approve = useApproveAccount();
  const reject = useRejectAccount();
  const [pendingRole, setPendingRole] = useState<AccountRole | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const busy = approve.isPending || reject.isPending;

  const handleApprove = (role: AccountRole) => {
    setPendingRole(role);
    approve.mutate(
      { user: account.principal.toText(), role },
      {
        onSuccess: () => {
          toast.success(
            `已批准「${account.displayName}」为${ROLE_LABELS[role]}`,
          );
        },
        onError: (error) => {
          toast.error(describeError(error));
        },
        onSettled: () => setPendingRole(null),
      },
    );
  };

  const handleReject = () => {
    setRejecting(true);
    reject.mutate(account.principal.toText(), {
      onSuccess: () => {
        toast.success(`已拒绝「${account.displayName}」的账号申请`);
      },
      onError: (error) => {
        toast.error(describeError(error));
      },
      onSettled: () => setRejecting(false),
    });
  };

  if (account.approval === ApprovalState.pending) {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <PermissionButton
          type="button"
          size="sm"
          allowed={!busy}
          deniedReason="正在处理，请稍候"
          data-ocid="users.approve_member_button"
          onClick={() => handleApprove(AccountRole.member)}
        >
          <Check className="size-3.5" aria-hidden="true" />
          {pendingRole === AccountRole.member ? "批准中…" : "批准为成员"}
        </PermissionButton>
        <PermissionButton
          type="button"
          size="sm"
          variant="outline"
          allowed={!busy}
          deniedReason="正在处理，请稍候"
          data-ocid="users.approve_admin_button"
          onClick={() => handleApprove(AccountRole.admin)}
        >
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {pendingRole === AccountRole.admin ? "批准中…" : "批准为管理员"}
        </PermissionButton>
        <PermissionButton
          type="button"
          size="sm"
          variant="ghost"
          allowed={!busy}
          deniedReason="正在处理，请稍候"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          data-ocid="users.reject_button"
          onClick={handleReject}
        >
          <X className="size-3.5" aria-hidden="true" />
          {rejecting ? "拒绝中…" : "拒绝"}
        </PermissionButton>
      </div>
    );
  }

  if (account.approval === ApprovalState.approved) {
    const targetRole =
      account.role === AccountRole.admin
        ? AccountRole.member
        : AccountRole.admin;
    const TargetIcon = targetRole === AccountRole.admin ? ShieldCheck : User;
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <PermissionButton
          type="button"
          size="sm"
          variant="outline"
          allowed={!busy && !isSelf}
          deniedReason={isSelf ? "不能调整自己的角色" : "正在处理，请稍候"}
          data-ocid="users.toggle_role_button"
          onClick={() => handleApprove(targetRole)}
        >
          <TargetIcon className="size-3.5" aria-hidden="true" />
          {pendingRole ? "调整中…" : `设为${ROLE_LABELS[targetRole]}`}
        </PermissionButton>
      </div>
    );
  }

  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      该账号已被拒绝，如需恢复请重新批准。
    </p>
  );
}

/** Empty permission set used when a user has no grant for a company yet. */
export const EMPTY_PERMISSIONS: PermissionSet = {
  view: false,
  edit: false,
  verify: false,
  sensitiveDownload: false,
};

export function isSamePermissions(a: PermissionSet, b: PermissionSet): boolean {
  return (
    a.view === b.view &&
    a.edit === b.edit &&
    a.verify === b.verify &&
    a.sensitiveDownload === b.sensitiveDownload
  );
}
