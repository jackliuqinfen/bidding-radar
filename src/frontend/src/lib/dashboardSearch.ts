/** Search params accepted by the /dashboard route; every key is required. */
export interface DashboardSearch {
  status: string | undefined;
  expiry: string | undefined;
  category: string | undefined;
  owner: string | undefined;
  company: string | undefined;
}

/**
 * Builds a complete /dashboard search object from a partial filter.
 * Returned as a reducer so TanStack Router accepts every required key.
 */
export function dashboardSearch(partial: Partial<DashboardSearch> = {}) {
  return (): DashboardSearch => ({
    status: partial.status,
    expiry: partial.expiry,
    category: partial.category,
    owner: partial.owner,
    company: partial.company,
  });
}
