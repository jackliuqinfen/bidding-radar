import type { RecordView } from "@/backend";
import { Button } from "@/components/ui/button";
import { useVerifyRecord } from "@/hooks/useRecordMutations";
import { describeError } from "@/lib/errors";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

export function VerifyButton({
  record,
  allowed,
  deniedReason,
}: {
  record: RecordView;
  allowed: boolean;
  deniedReason: string;
}) {
  const verify = useVerifyRecord();
  const [error, setError] = useState<string | null>(null);

  if (record.status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-status-verified-foreground">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        已核实
      </span>
    );
  }

  const handleVerify = () => {
    setError(null);
    verify.mutate(
      { id: record.id, expectedVersion: record.version },
      {
        onError: (err) => setError(describeError(err)),
      },
    );
  };

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        data-ocid="record.verify_button"
        onClick={handleVerify}
        disabled={!allowed || verify.isPending}
        title={allowed ? undefined : deniedReason}
      >
        {verify.isPending && (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        )}
        核实
      </Button>
      {!allowed && (
        <p className="max-w-xs text-xs text-muted-foreground">{deniedReason}</p>
      )}
      {error && (
        <p
          role="alert"
          data-ocid="record.verify.error_state"
          className="text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
