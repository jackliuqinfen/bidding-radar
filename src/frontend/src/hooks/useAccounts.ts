import { createActor } from "@/backend";
import type { AccountView, UserPermissions } from "@/backend";
import { unwrap } from "@/lib/errors";
import { useActor } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import { useQuery } from "@tanstack/react-query";

export function useAccounts() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AccountView[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      if (!actor) return [];
      return unwrap(await actor.listAccounts());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserPermissions(user: string | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<UserPermissions | null>({
    queryKey: ["userPermissions", user],
    queryFn: async () => {
      if (!actor || !user) return null;
      return unwrap(await actor.getUserPermissions(Principal.fromText(user)));
    },
    enabled: !!actor && !isFetching && !!user,
  });
}
