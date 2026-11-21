import type { AccountView } from "@/backend";
import { formatDateTime } from "@/lib/format";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

/** Users waiting for approval, each linking to the user management page. */
export function PendingAccountList({ accounts }: { accounts: AccountView[] }) {
  return (
    <ul className="divide-y divide-border/60">
      {accounts.map((account, index) => (
        <li key={account.principal.toText()}>
          <Link
            to="/users"
            data-ocid={`home.pending_user.link.${index + 1}`}
            className="group flex items-center gap-3 rounded-md px-2 py-2.5 transition-smooth hover:bg-accent/60"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-display text-xs font-semibold text-muted-foreground">
              {account.displayName.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {account.displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                申请于 {formatDateTime(account.registeredAt)}
              </p>
            </div>
            <span className="shrink-0 rounded-sm border border-status-pending-border bg-status-pending-soft px-1.5 py-0.5 text-xs font-medium text-status-pending-foreground">
              {account.approvalLabel}
            </span>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
