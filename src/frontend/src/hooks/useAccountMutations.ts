import { createActor } from "@/backend";
import type { AccountRole, AccountView, SampleReport } from "@/backend";
import { unwrap } from "@/lib/errors";
import { useActor } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries();
  };
}

/** First sign-in registration with a display name. */
export function useRegisterAccount() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateAll();
  return useMutation<AccountView, unknown, string>({
    mutationFn: async (displayName: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.registerAccount(displayName));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

/** Audits a sign-in and returns the caller's account. */
export function useSignIn() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateAll();
  return useMutation<AccountView | null, unknown, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.signIn();
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useApproveAccount() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateAll();
  return useMutation<AccountView, unknown, { user: string; role: AccountRole }>(
    {
      mutationFn: async ({ user, role }) => {
        if (!actor) throw new Error("Backend is not ready");
        return unwrap(
          await actor.approveAccount(Principal.fromText(user), role),
        );
      },
      onSuccess: () => {
        invalidate();
      },
    },
  );
}

export function useRejectAccount() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateAll();
  return useMutation<AccountView, unknown, string>({
    mutationFn: async (user: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.rejectAccount(Principal.fromText(user)));
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useSetAccountRole() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateAll();
  return useMutation<AccountView, unknown, { user: string; role: AccountRole }>(
    {
      mutationFn: async ({ user, role }) => {
        if (!actor) throw new Error("Backend is not ready");
        return unwrap(
          await actor.setAccountRole(Principal.fromText(user), role),
        );
      },
      onSuccess: () => {
        invalidate();
      },
    },
  );
}

export function useSeedSampleData() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateAll();
  return useMutation<SampleReport, unknown, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.seedSampleData());
    },
    onSuccess: () => {
      invalidate();
    },
  });
}
