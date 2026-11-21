import { createActor } from "@/backend";
import type { AccountView } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

/** Own profile + approval state. Allowed for pending users. */
export function useMyAccount() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AccountView | null>({
    queryKey: ["myAccount"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyAccount();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}
