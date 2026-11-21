import { createActor } from "@/backend";
import type {
  AttachmentView,
  DownloadInfo,
  NewAttachmentInput,
  RecordView,
  ReplaceAttachmentInput,
} from "@/backend";
import { unwrap } from "@/lib/errors";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function useInvalidateAttachments() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["record"] });
    void queryClient.invalidateQueries({ queryKey: ["records"] });
    void queryClient.invalidateQueries({ queryKey: ["companyDetail"] });
    void queryClient.invalidateQueries({ queryKey: ["recordHistory"] });
  };
}

export function useAddAttachment() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateAttachments();
  return useMutation<AttachmentView, unknown, NewAttachmentInput>({
    mutationFn: async (input: NewAttachmentInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.addAttachment(input));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useReplaceAttachment() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateAttachments();
  return useMutation<RecordView, unknown, ReplaceAttachmentInput>({
    mutationFn: async (input: ReplaceAttachmentInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.replaceAttachment(input));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useDownloadAttachment() {
  const { actor } = useActor(createActor);
  return useMutation<
    DownloadInfo,
    unknown,
    { attachmentId: bigint; version: bigint | null }
  >({
    mutationFn: async ({ attachmentId, version }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.downloadAttachment(attachmentId, version));
    },
  });
}
