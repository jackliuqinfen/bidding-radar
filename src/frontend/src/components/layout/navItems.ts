import {
  Building2,
  ClipboardList,
  Home,
  LayoutDashboard,
  ScrollText,
  Users,
  UsersRound,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  adminOnly?: boolean;
  /** Shown in the mobile bottom tab bar. */
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "首页", icon: Home, mobile: true },
  { to: "/dashboard", label: "缺口看板", icon: LayoutDashboard, mobile: true },
  { to: "/companies", label: "公司档案", icon: Building2, mobile: true },
  { to: "/personnel", label: "人员档案", icon: UsersRound, mobile: true },
  {
    to: "/notifications",
    label: "通知中心",
    icon: ClipboardList,
    mobile: true,
  },
  { to: "/users", label: "用户与权限", icon: Users, adminOnly: true },
  { to: "/audit", label: "审计日志", icon: ScrollText, adminOnly: true },
];
