import { createActor } from "@/backend";
import type { CompanyDetail, RecordFilter } from "@/backend";
import { unwrap } from "@/lib/errors";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export function useCompanyDetail(companyId: bigint, filter: RecordFilter) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CompanyDetail>({
    queryKey: ["companyDetail", companyId, filter],
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.getCompanyDetail(companyId, filter));
    },
    enabled: !!actor && !isFetching,
  });
}
