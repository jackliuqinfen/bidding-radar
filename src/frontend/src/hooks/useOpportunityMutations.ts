import { createActor } from "@/backend";
import type {
  CheckItemInput,
  CheckItemUpdate,
  CheckItemView,
  OpportunityInput,
  OpportunityStatus,
  OpportunityUpdate,
  OpportunityView,
} from "@/backend";
import { unwrap } from "@/lib/errors";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function useInvalidateOpportunities() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    void queryClient.invalidateQueries({ queryKey: ["opportunity"] });
    void queryClient.invalidateQueries({ queryKey: ["opportunityTodo"] });
    void queryClient.invalidateQueries({
      queryKey: ["opportunityStatusHistory"],
    });
    void queryClient.invalidateQueries({ queryKey: ["checkItems"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    void queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
  };
}

export function useCreateOpportunityDraft() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateOpportunities();
  return useMutation<OpportunityView, unknown, OpportunityInput>({
    mutationFn: async (input: OpportunityInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.createOpportunityDraft(input));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useUpdateOpportunityDraft() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateOpportunities();
  return useMutation<
    OpportunityView,
    unknown,
    { id: bigint; change: OpportunityUpdate }
  >({
    mutationFn: async ({ id, change }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.updateOpportunityDraft(id, change));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useSubmitOpportunity() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateOpportunities();
  return useMutation<OpportunityView, unknown, bigint>({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.submitOpportunity(id));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useChangeOpportunityStatus() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateOpportunities();
  return useMutation<
    OpportunityView,
    unknown,
    { id: bigint; toStatus: OpportunityStatus; reason: string }
  >({
    mutationFn: async ({ id, toStatus, reason }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.changeOpportunityStatus(id, toStatus, reason));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useCreateCheckItem() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateOpportunities();
  return useMutation<CheckItemView, unknown, CheckItemInput>({
    mutationFn: async (input: CheckItemInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.createCheckItem(input));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useUpdateCheckItem() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateOpportunities();
  return useMutation<
    CheckItemView,
    unknown,
    { id: bigint; change: CheckItemUpdate }
  >({
    mutationFn: async ({ id, change }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.updateCheckItem(id, change));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useConfirmCheckItem() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateOpportunities();
  return useMutation<CheckItemView, unknown, bigint>({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.confirmCheckItem(id));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}
