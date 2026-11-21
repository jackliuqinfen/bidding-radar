import type { RecordView } from "@/backend";
import { RecordBadges } from "@/components/records/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { maskIdNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ChevronRight, IdCard, UserRound } from "lucide-react";

export function PersonCard({
  person,
  index,
}: {
  person: RecordView;
  index: number;
}) {
  const data = person.data.__kind__ === "person" ? person.data.person : null;
  const name = data?.name || person.title;
  const position = data?.position || "未填写岗位";
  const idNumber = data?.idNumber ? maskIdNumber(data.idNumber) : "—";

  return (
    <Link
      to="/personnel/$personId"
      params={{ personId: person.id.toString() }}
      data-ocid={`personnel.item.${index}`}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-subtle transition-smooth",
        "hover:border-primary/40 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UserRound className="size-5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate font-display text-sm font-semibold text-foreground">
            {name}
          </span>
          <Badge
            variant="secondary"
            className="rounded-sm px-1.5 py-0 text-[11px] font-normal"
          >
            {position}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <IdCard className="size-3" aria-hidden="true" />
            <span className="font-mono tracking-tight">{idNumber}</span>
          </span>
          <span className="truncate">维护责任人 {person.maintainerName}</span>
        </div>
        <RecordBadges
          status={person.status}
          expiryFlag={person.expiryFlag}
          className="pt-0.5"
        />
      </div>

      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
