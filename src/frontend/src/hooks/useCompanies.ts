import { createActor } from "@/backend";
import type { CompanyView } from "@/backend";
import { unwrap } from "@/lib/errors";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export function useCompanies() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CompanyView[]>({
    queryKey: ["companies"],
    queryFn: async () => {
      if (!actor) return [];
      return unwrap(await actor.listCompanies());
    },
    enabled: !!actor && !isFetching,
  });
}
