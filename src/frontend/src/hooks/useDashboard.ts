import { createActor } from "@/backend";
import type { CompanyGapRow, HomeSummary } from "@/backend";
import { unwrap } from "@/lib/errors";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

/** Role home data; also triggers expiry notifications server-side. */
export function useHomeSummary() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<HomeSummary>({
    queryKey: ["homeSummary"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.getHomeSummary());
    },
    enabled: !!actor && !isFetching,
  });
}

/** Every company with gap counts only. */
export function useGapDashboard() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CompanyGapRow[]>({
    queryKey: ["gapDashboard"],
    queryFn: async () => {
      if (!actor) return [];
      return unwrap(await actor.getGapDashboard());
    },
    enabled: !!actor && !isFetching,
  });
}
