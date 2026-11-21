import { createActor } from "@/backend";
import type { AuditFilter, AuditPage } from "@/backend";
import { unwrap } from "@/lib/errors";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export function useAuditLog(filter: AuditFilter) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AuditPage>({
    queryKey: ["auditLog", filter],
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.listAuditLog(filter));
    },
    enabled: !!actor && !isFetching,
  });
}
