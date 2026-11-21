import { createActor } from "@/backend";
import type { RecordFilter, RecordView } from "@/backend";
import { unwrap } from "@/lib/errors";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

/** Stable query key for a record filter (bigints serialise via toJSON). */
export function recordsKey(filter: RecordFilter) {
  return ["records", filter] as const;
}

export function useRecords(filter: RecordFilter) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<RecordView[]>({
    queryKey: recordsKey(filter),
    queryFn: async () => {
      if (!actor) return [];
      return unwrap(await actor.listRecords(filter));
    },
    enabled: !!actor && !isFetching,
  });
}
