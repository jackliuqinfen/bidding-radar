import { createActor } from "@/backend";
import type {
  CheckItemView,
  OpportunityFilter,
  OpportunityListItem,
  OpportunityTodo,
  OpportunityView,
  StatusChangeView,
} from "@/backend";
import { unwrap } from "@/lib/errors";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

/** Stable query key for an opportunity filter (bigints serialise via toJSON). */
export function opportunitiesKey(filter: OpportunityFilter) {
  return ["opportunities", filter] as const;
}

export function useOpportunities(filter: OpportunityFilter) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<OpportunityListItem[]>({
    queryKey: opportunitiesKey(filter),
    queryFn: async () => {
      if (!actor) return [];
      return unwrap(await actor.listOpportunities(filter));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOpportunity(id: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<OpportunityView>({
    queryKey: ["opportunity", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) throw new Error("Backend is not ready");
      return unwrap(await actor.getOpportunity(id));
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useOpportunityStatusHistory(id: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<StatusChangeView[]>({
    queryKey: ["opportunityStatusHistory", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) return [];
      return unwrap(await actor.getOpportunityStatusHistory(id));
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useCheckItems(opportunityId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CheckItemView[]>({
    queryKey: ["checkItems", opportunityId?.toString()],
    queryFn: async () => {
      if (!actor || opportunityId === undefined) return [];
      return unwrap(await actor.listCheckItems(opportunityId));
    },
    enabled: !!actor && !isFetching && opportunityId !== undefined,
  });
}

/** 机会池待办: closing-soon announcements and unconfirmed check items. */
export function useOpportunityTodo() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<OpportunityTodo>({
    queryKey: ["opportunityTodo"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.getOpportunityTodo());
    },
    enabled: !!actor && !isFetching,
  });
}
