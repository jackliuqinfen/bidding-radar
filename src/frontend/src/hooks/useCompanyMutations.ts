import { createActor } from "@/backend";
import type {
  CompanyInput,
  CompanyPermissionGrant,
  CompanyView,
  PermissionSet,
} from "@/backend";
import { unwrap } from "@/lib/errors";
import { useActor } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateCompany() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<CompanyView, unknown, CompanyInput>({
    mutationFn: async (input: CompanyInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.createCompany(input));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["companies"] });
      void queryClient.invalidateQueries({ queryKey: ["gapDashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["homeSummary"] });
    },
  });
}

export function useUpdateCompany() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<CompanyView, unknown, { id: bigint; input: CompanyInput }>(
    {
      mutationFn: async ({ id, input }) => {
        if (!actor) throw new Error("Backend is not ready");
        return unwrap(await actor.updateCompany(id, input));
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["companies"] });
        void queryClient.invalidateQueries({ queryKey: ["companyDetail"] });
      },
    },
  );
}

export function useSetUserCompanyPermissions() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<
    CompanyPermissionGrant,
    unknown,
    { user: string; companyId: bigint; permissions: PermissionSet }
  >({
    mutationFn: async ({ user, companyId, permissions }) => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(
        await actor.setUserCompanyPermissions(
          Principal.fromText(user),
          companyId,
          permissions,
        ),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["userPermissions"] });
      void queryClient.invalidateQueries({ queryKey: ["myPermissions"] });
    },
  });
}
