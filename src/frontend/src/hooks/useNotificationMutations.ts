import { createActor } from "@/backend";
import { unwrap } from "@/lib/errors";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useMarkNotificationRead() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<null, unknown, bigint>({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.markNotificationRead(id));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<null, unknown, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.markAllNotificationsRead());
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}
