import type { CompanyPermissionGrant, PermissionSet } from "@/backend";
import { useMyPermissions } from "@/hooks/usePermissions";

export interface CompanyAccess {
  canView: boolean;
  canEdit: boolean;
  canVerify: boolean;
  canSensitiveDownload: boolean;
}

const NO_ACCESS: CompanyAccess = {
  canView: false,
  canEdit: false,
  canVerify: false,
  canSensitiveDownload: false,
};

function fromSet(set: PermissionSet): CompanyAccess {
  return {
    canView: set.view,
    canEdit: set.edit,
    canVerify: set.verify,
    canSensitiveDownload: set.sensitiveDownload,
  };
}

/** The caller's own grants, indexed by company id. */
export function useMyAccess() {
  const query = useMyPermissions();
  const byCompany = new Map<string, CompanyAccess>();
  for (const grant of query.data ?? []) {
    byCompany.set(grant.companyId.toString(), fromSet(grant.permissions));
  }
  const accessFor = (companyId: bigint): CompanyAccess =>
    byCompany.get(companyId.toString()) ?? NO_ACCESS;
  return { ...query, accessFor };
}

export function grantFor(
  grants: CompanyPermissionGrant[] | undefined,
  companyId: bigint,
): CompanyAccess {
  const grant = grants?.find((g) => g.companyId === companyId);
  return grant ? fromSet(grant.permissions) : NO_ACCESS;
}
