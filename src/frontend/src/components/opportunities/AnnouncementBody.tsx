import type { Clause, ClauseKind } from "@/backend";
import { CLAUSE_KIND_OPTIONS } from "@/components/opportunities/opportunityConfig";
import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";

/** Splits the announcement body into paragraphs on blank lines. */
function paragraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

/**
 * Renders the full announcement text plus the extracted clauses. Each clause
 * excerpt is the traceable source a check item's basis must quote.
 */
export function AnnouncementBody({
  body,
  clauses,
  className,
}: {
  body: string;
  clauses: Clause[];
  className?: string;
}) {
  const blocks = paragraphs(body);
  const blockIds = blocks.map(
    (block, index) => `para-${index}-${block.slice(0, 12)}`,
  );
  const clauseIds = clauses.map(
    (clause, index) => `clause-${index}-${clause.kind}`,
  );
  const clauseLabel = (kind: ClauseKind) =>
    CLAUSE_KIND_OPTIONS.find((option) => option.value === kind)?.label ??
    "条款";

  return (
    <div className={cn("space-y-5", className)}>
      <div
        data-ocid="opportunity_detail.body"
        className="space-y-3 text-sm leading-relaxed text-foreground"
      >
        {blocks.length === 0 ? (
          <p className="text-muted-foreground">公告正文尚未录入。</p>
        ) : (
          blocks.map((block, index) => (
            <p
              key={blockIds[index]}
              className="whitespace-pre-line break-words"
            >
              {block}
            </p>
          ))
        )}
      </div>

      {clauses.length > 0 && (
        <section
          data-ocid="opportunity_detail.clauses"
          aria-labelledby="clause-heading"
          className="rounded-lg border border-border bg-muted/40 p-4"
        >
          <h3
            id="clause-heading"
            className="mb-3 flex items-center gap-1.5 font-display text-sm font-semibold text-foreground"
          >
            <Quote className="size-3.5 text-primary" aria-hidden="true" />
            关键条款摘录
          </h3>
          <ul className="space-y-2.5">
            {clauses.map((clause, index) => (
              <li
                key={clauseIds[index]}
                data-ocid={`opportunity_detail.clause.${index + 1}`}
                className="border-l-2 border-primary/40 pl-3"
              >
                <p className="text-xs font-medium text-primary">
                  {clauseLabel(clause.kind)}
                </p>
                <p className="mt-0.5 break-words text-sm text-foreground">
                  {clause.excerpt}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
