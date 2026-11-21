import { SignInButton } from "@/components/InternetIdentity";
import { APP_NAME } from "@/lib/labels";
import { Clock3, ShieldX } from "lucide-react";

export function PendingScreen({ displayName }: { displayName: string }) {
  return (
    <section
      aria-label="等待批准"
      data-ocid="pending.panel"
      className="flex min-h-dvh flex-col items-center justify-center bg-radar-grid px-6 py-12"
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center shadow-subtle">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-status-pending-soft text-status-pending-foreground">
          <Clock3 className="size-6" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-semibold text-foreground">
          等待管理员批准
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {displayName}，您的账号已提交，正在等待管理员批准。批准后即可访问{" "}
          {APP_NAME}。
        </p>
        <div className="mt-6">
          <SignInButton className="text-xs text-muted-foreground underline-offset-4 hover:underline" />
        </div>
      </div>
    </section>
  );
}

export function RejectedScreen({ displayName }: { displayName: string }) {
  return (
    <section
      aria-label="账号被拒绝"
      data-ocid="rejected.panel"
      className="flex min-h-dvh flex-col items-center justify-center bg-radar-grid px-6 py-12"
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center shadow-subtle">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldX className="size-6" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-semibold text-foreground">
          账号申请未通过
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {displayName}，您的账号申请已被拒绝。如需访问，请联系管理员。
        </p>
        <div className="mt-6">
          <SignInButton className="text-xs text-muted-foreground underline-offset-4 hover:underline" />
        </div>
      </div>
    </section>
  );
}
