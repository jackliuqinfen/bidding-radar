import { SignInButton } from "@/components/InternetIdentity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterAccount } from "@/hooks/useAccountMutations";
import { describeError } from "@/lib/errors";
import { APP_NAME } from "@/lib/labels";
import { AlertTriangle, Loader2, Radar } from "lucide-react";
import { type FormEvent, useState } from "react";

export function RegisterScreen() {
  const register = useRegisterAccount();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("请填写显示名称。");
      return;
    }
    setError(null);
    register.mutate(trimmed, {
      onError: (err) => setError(describeError(err)),
    });
  };

  return (
    <section
      aria-label="注册账号"
      data-ocid="register.panel"
      className="flex min-h-dvh flex-col items-center justify-center bg-radar-grid px-6 py-12"
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-subtle">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Radar className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-center font-display text-xl font-semibold text-foreground">
          完善账号信息
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          首次登录 {APP_NAME}，请填写您的显示名称。
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="register-name"
              className="text-xs text-muted-foreground"
            >
              显示名称
            </Label>
            <Input
              id="register-name"
              data-ocid="register.name.input"
              value={name}
              placeholder="如：李建国"
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {error && (
            <div
              role="alert"
              data-ocid="register.error_state"
              className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"
            >
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            data-ocid="register.submit_button"
            className="w-full"
            disabled={register.isPending}
          >
            {register.isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            提交
          </Button>
        </form>

        <div className="mt-4 border-t border-border pt-4 text-center">
          <SignInButton className="text-xs text-muted-foreground underline-offset-4 hover:underline" />
        </div>
      </div>
    </section>
  );
}
