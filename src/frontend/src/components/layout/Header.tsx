import type { AccountRole } from "@/backend";
import { SignInButton } from "@/components/InternetIdentity";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUnreadCount } from "@/hooks/useNotifications";
import { ROLE_LABELS } from "@/lib/labels";
import { Link } from "@tanstack/react-router";
import { Bell, UserRound } from "lucide-react";

export function Header({
  displayName,
  role,
}: {
  displayName: string;
  role: AccountRole;
}) {
  const { data: unread } = useUnreadCount();
  const unreadCount = unread ?? 0n;
  const hasUnread = unreadCount > 0n;

  return (
    <header
      data-ocid="header"
      className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-4 md:px-6"
    >
      <div className="min-w-0 text-sm text-muted-foreground">
        <span className="hidden sm:inline">集团资质档案</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            hasUnread
              ? `通知中心，${unreadCount.toString()} 条未读`
              : "通知中心"
          }
        >
          <Link to="/notifications" data-ocid="header.notifications_button">
            <Bell className="size-5" aria-hidden="true" />
            {hasUnread && (
              <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
                {unreadCount > 99n ? "99+" : unreadCount.toString()}
              </span>
            )}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-ocid="header.user_menu_button"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-smooth hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="size-4" aria-hidden="true" />
              </span>
              <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
                <span className="max-w-[10rem] truncate font-medium text-foreground">
                  {displayName}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {ROLE_LABELS[role]}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">
                {displayName}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {ROLE_LABELS[role]}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                to="/notifications"
                data-ocid="header.user_menu.notifications_link"
              >
                <Bell className="size-4" aria-hidden="true" />
                通知中心
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-1 py-1">
              <SignInButton className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground transition-smooth hover:bg-accent" />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
