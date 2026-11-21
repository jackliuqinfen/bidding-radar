import { createActor } from "@/backend";
import type { CompanyPermissionGrant } from "@/backend";
import { unwrap } from "@/lib/errors";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

/** The caller's own company permission grants. */
export function useMyPermissions() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CompanyPermissionGrant[]>({
    queryKey: ["myPermissions"],
    queryFn: async () => {
      if (!actor) return [];
      return unwrap(await actor.getMyPermissions());
    },
    enabled: !!actor && !isFetching,
  });
}
