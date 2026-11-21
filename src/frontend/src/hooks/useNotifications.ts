import { createActor } from "@/backend";
import type { NotificationView } from "@/backend";
import { unwrap } from "@/lib/errors";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export function useNotifications() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<NotificationView[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return unwrap(await actor.listNotifications());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUnreadCount() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<bigint>({
    queryKey: ["unreadCount"],
    queryFn: async () => {
      if (!actor) return 0n;
      return unwrap(await actor.getUnreadCount());
    },
    enabled: !!actor && !isFetching,
  });
}
