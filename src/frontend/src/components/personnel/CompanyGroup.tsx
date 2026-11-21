import type { CompanyView, RecordView } from "@/backend";
import { EmptyState } from "@/components/common/States";
import { PersonCard } from "@/components/personnel/PersonCard";
import { Button } from "@/components/ui/button";
import { Building2, UserPlus } from "lucide-react";

export function CompanyGroup({
  company,
  people,
  canEdit,
  onAdd,
}: {
  company: CompanyView;
  people: RecordView[];
  canEdit: boolean;
  onAdd: () => void;
}) {
  return (
    <section
      data-ocid="personnel.group"
      className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Building2
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="truncate font-display text-sm font-semibold text-foreground">
            {company.name}
          </h2>
          <span className="shrink-0 rounded-sm bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground">
            {people.length} 人
          </span>
        </div>
        {canEdit && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-ocid="personnel.add_button"
            onClick={onAdd}
          >
            <UserPlus className="size-3.5" aria-hidden="true" />
            新增人员
          </Button>
        )}
      </header>

      <div className="space-y-2 p-3">
        {people.length === 0 ? (
          <EmptyState
            title="暂无人员"
            description={
              canEdit
                ? "为该单位登记第一位人员，便于后续维护证书与业绩。"
                : "该单位尚未登记人员。"
            }
            className="border-0 bg-transparent py-8"
            action={
              canEdit ? (
                <Button
                  type="button"
                  size="sm"
                  data-ocid="personnel.add_button"
                  onClick={onAdd}
                >
                  <UserPlus className="size-3.5" aria-hidden="true" />
                  新增人员
                </Button>
              ) : undefined
            }
          />
        ) : (
          people.map((person, index) => (
            <PersonCard
              key={person.id.toString()}
              person={person}
              index={index}
            />
          ))
        )}
      </div>
    </section>
  );
}
