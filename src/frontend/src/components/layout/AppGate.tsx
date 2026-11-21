import { type AccountView, ApprovalState } from "@/backend";
import { InlineLoading } from "@/components/common/States";
import {
  PendingScreen,
  RejectedScreen,
} from "@/components/layout/ApprovalScreens";
import { Header } from "@/components/layout/Header";
import { RegisterScreen } from "@/components/layout/RegisterScreen";
import { MobileTabBar, Sidebar } from "@/components/layout/Sidebar";
import { SignInScreen } from "@/components/layout/SignInScreen";
import { useMyAccount } from "@/hooks/useAccount";
import { useSignIn } from "@/hooks/useAccountMutations";
import { APP_NAME } from "@/lib/labels";
import { Outlet } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

function AppShell({ account }: { account: AccountView }) {
  const isAdmin = account.role === "admin";
  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header displayName={account.displayName} role={account.role} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6 lg:pb-8">
          <div className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>
        <footer className="hidden border-t border-border px-6 py-3 text-center text-xs text-muted-foreground lg:block">
          © {new Date().getFullYear()} {APP_NAME} · 内部使用
        </footer>
      </div>
      <MobileTabBar isAdmin={isAdmin} />
    </div>
  );
}

export function AppGate() {
  const { data: account, isLoading, isError } = useMyAccount();
  const signIn = useSignIn();
  const attempted = useRef(false);

  // Audit the sign-in once per session, after the account is known.
  useEffect(() => {
    if (account && !attempted.current) {
      attempted.current = true;
      signIn.mutate();
    }
  }, [account, signIn]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <InlineLoading label="正在加载账号信息…" />
      </div>
    );
  }

  if (isError) {
    return <SignInScreen />;
  }

  if (!account) {
    return <RegisterScreen />;
  }

  if (account.approval === ApprovalState.pending) {
    return <PendingScreen displayName={account.displayName} />;
  }

  if (account.approval === ApprovalState.rejected) {
    return <RejectedScreen displayName={account.displayName} />;
  }

  return <AppShell account={account} />;
}
