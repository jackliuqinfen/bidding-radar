import type { RecordView } from "@/backend";
import { Button } from "@/components/ui/button";
import { useViewPersonIdNumber } from "@/hooks/useRecordMutations";
import { describeError } from "@/lib/errors";
import { maskIdNumber } from "@/lib/format";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useState } from "react";

/**
 * Masked ID number with an explicit reveal that goes through the audited
 * backend call. Without 敏感下载 the button is disabled and the reason shown.
 */
export function IdNumberField({
  person,
  canSensitiveDownload,
}: {
  person: RecordView;
  canSensitiveDownload: boolean;
}) {
  const view = useViewPersonIdNumber();
  const [revealed, setRevealed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const masked =
    person.data.__kind__ === "person" && person.data.person.idNumber
      ? maskIdNumber(person.data.person.idNumber)
      : "—";

  const handleReveal = () => {
    if (revealed) {
      setRevealed(null);
      return;
    }
    setError(null);
    view.mutate(person.id, {
      onSuccess: (full) => setRevealed(full),
      onError: (err) => setError(describeError(err)),
    });
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">身份证号</p>
      <div className="flex flex-wrap items-center gap-2">
        <span
          data-ocid="person.id_number.value"
          className="font-mono text-sm tracking-tight text-foreground"
        >
          {revealed ?? masked}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          data-ocid="person.id_number.reveal_button"
          disabled={!canSensitiveDownload || view.isPending}
          onClick={handleReveal}
        >
          {view.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : revealed ? (
            <EyeOff className="size-3.5" aria-hidden="true" />
          ) : (
            <Eye className="size-3.5" aria-hidden="true" />
          )}
          {revealed ? "隐藏" : "查看完整号码"}
        </Button>
      </div>
      {!canSensitiveDownload && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="size-3" aria-hidden="true" />
          缺少「敏感下载」权限，无法查看完整身份证号。
        </p>
      )}
      {error && (
        <p
          role="alert"
          data-ocid="person.id_number.error_state"
          className="text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
