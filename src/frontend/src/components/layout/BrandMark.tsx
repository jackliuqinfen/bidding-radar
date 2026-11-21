import { APP_NAME, APP_TAGLINE } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Radar } from "lucide-react";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <Radar className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-sm font-semibold leading-tight text-sidebar-foreground">
          {APP_NAME}
        </span>
        <span className="block truncate text-[11px] leading-tight text-sidebar-foreground/60">
          {APP_TAGLINE}
        </span>
      </span>
    </div>
  );
}
