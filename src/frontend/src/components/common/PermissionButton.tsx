import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

/**
 * A button that is disabled when the caller lacks the required permission,
 * with a tooltip explaining exactly what is missing.
 */
export function PermissionButton({
  allowed,
  deniedReason,
  children,
  className,
  tooltipSide = "top",
  ...props
}: ComponentProps<typeof Button> & {
  allowed: boolean;
  deniedReason: string;
  children: ReactNode;
  tooltipSide?: "top" | "bottom" | "left" | "right";
}) {
  const button = (
    <Button
      {...props}
      disabled={props.disabled || !allowed}
      aria-disabled={!allowed}
      className={cn(!allowed && "cursor-not-allowed", className)}
    >
      {children}
    </Button>
  );

  if (allowed) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{button}</span>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{deniedReason}</TooltipContent>
    </Tooltip>
  );
}
