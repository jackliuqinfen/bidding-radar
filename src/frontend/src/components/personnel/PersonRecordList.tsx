import type { RecordView } from "@/backend";
import { EmptyState } from "@/components/common/States";
import { PersonRecordRow } from "@/components/personnel/PersonRecordRow";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function PersonRecordList({
  records,
  canEdit,
  addLabel,
  emptyTitle,
  emptyDescription,
  onAdd,
  onOpen,
}: {
  records: RecordView[];
  canEdit: boolean;
  addLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  onAdd: () => void;
  onOpen: (record: RecordView) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">共 {records.length} 条</p>
        {canEdit && (
          <Button
            type="button"
            size="sm"
            data-ocid="person.record.add_button"
            onClick={onAdd}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {addLabel}
          </Button>
        )}
      </div>

      {records.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={
            canEdit ? (
              <Button
                type="button"
                size="sm"
                data-ocid="person.record.add_button"
                onClick={onAdd}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                {addLabel}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-2">
          {records.map((record, index) => (
            <PersonRecordRow
              key={record.id.toString()}
              record={record}
              index={index}
              onOpen={onOpen}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
