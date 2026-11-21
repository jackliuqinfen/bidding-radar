import { createActor } from "@/backend";
import type {
  ChangeEntryView,
  RecordInput,
  RecordUpdate,
  RecordView,
} from "@/backend";
import { unwrap } from "@/lib/errors";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function useInvalidateRecords() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["records"] });
    void queryClient.invalidateQueries({ queryKey: ["companyDetail"] });
    void queryClient.invalidateQueries({ queryKey: ["gapDashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["homeSummary"] });
    void queryClient.invalidateQueries({ queryKey: ["recordHistory"] });
  };
}

export function useRecord(id: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<RecordView>({
    queryKey: ["record", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) throw new Error("Backend is not ready");
      return unwrap(await actor.getRecord(id));
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useRecordHistory(id: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<ChangeEntryView[]>({
    queryKey: ["recordHistory", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) return [];
      return unwrap(await actor.getRecordHistory(id));
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useCreateRecord() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateRecords();
  return useMutation<RecordView, unknown, RecordInput>({
    mutationFn: async (input: RecordInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.createRecord(input));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useUpdateRecord() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateRecords();
  return useMutation<
    RecordView,
    unknown,
    { id: bigint; expectedVersion: bigint; change: RecordUpdate }
  >({
    mutationFn: async ({ id, expectedVersion, change }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.updateRecord(id, expectedVersion, change));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useVerifyRecord() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateRecords();
  return useMutation<
    RecordView,
    unknown,
    { id: bigint; expectedVersion: bigint }
  >({
    mutationFn: async ({ id, expectedVersion }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.verifyRecord(id, expectedVersion));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useViewPersonIdNumber() {
  const { actor } = useActor(createActor);
  return useMutation<string, unknown, bigint>({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.viewPersonIdNumber(id));
    },
  });
}
