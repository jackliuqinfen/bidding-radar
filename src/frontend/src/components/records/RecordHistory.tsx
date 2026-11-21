import { InlineLoading } from "@/components/common/States";
import { useRecordHistory } from "@/hooks/useRecordMutations";
import { formatDateTime } from "@/lib/format";
import { CHANGE_ACTION_LABELS } from "@/lib/labels";
import { History } from "lucide-react";

export function RecordHistory({ recordId }: { recordId: bigint }) {
  const { data, isLoading, isError } = useRecordHistory(recordId);

  return (
    <section data-ocid="record.history.panel" className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <History className="size-4 text-muted-foreground" aria-hidden="true" />
        变更历史
      </h3>
      {isLoading ? (
        <InlineLoading label="正在加载历史…" />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">历史记录暂时无法加载。</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无变更记录。</p>
      ) : (
        <ol className="space-y-3 border-l border-border pl-4">
          {data.map((entry) => (
            <li key={entry.id.toString()} className="relative">
              <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-foreground">
                  {CHANGE_ACTION_LABELS[entry.action]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {entry.editorName} · {formatDateTime(entry.at)} · 版本{" "}
                  {entry.resultingVersion.toString()}
                </span>
              </div>
              {entry.changes.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {entry.changes.map((change) => (
                    <li
                      key={`${entry.id}-${change.field}`}
                      className="truncate"
                    >
                      {change.field}：{change.before || "—"} →{" "}
                      {change.after || "—"}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
