import { SignInButton } from "@/components/InternetIdentity";
import { APP_NAME, APP_TAGLINE } from "@/lib/labels";
import { Radar } from "lucide-react";

export function SignInScreen() {
  return (
    <section
      aria-label="登录"
      data-ocid="auth.panel"
      className="flex min-h-dvh flex-col items-center justify-center bg-radar-grid px-6 py-12"
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center shadow-subtle">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Radar className="size-6" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-semibold text-foreground">
          {APP_NAME}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{APP_TAGLINE}</p>
        <p className="mt-5 text-sm text-muted-foreground">
          使用 Internet Identity 登录以访问集团内部档案。
        </p>
        <div className="mt-5">
          <SignInButton className="w-full rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-smooth hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60" />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          首次登录需填写显示名称，并由管理员批准后使用。
        </p>
      </div>
    </section>
  );
}
