import { AppGate } from "@/components/layout/AppGate";
import { parseOpportunitySearch } from "@/lib/opportunitySearch";
import AuditPage from "@/pages/AuditPage";
import CompaniesPage from "@/pages/CompaniesPage";
import CompanyDetailPage from "@/pages/CompanyDetailPage";
import DashboardPage from "@/pages/DashboardPage";
import HomePage from "@/pages/HomePage";
import NotificationsPage from "@/pages/NotificationsPage";
import OpportunitiesPage from "@/pages/OpportunitiesPage";
import OpportunityDetailPage from "@/pages/OpportunityDetailPage";
import PersonDetailPage from "@/pages/PersonDetailPage";
import PersonnelPage from "@/pages/PersonnelPage";
import UsersPage from "@/pages/UsersPage";
import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({ component: AppGate });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  validateSearch: (search: Record<string, unknown>) => ({
    status: typeof search.status === "string" ? search.status : undefined,
    expiry: typeof search.expiry === "string" ? search.expiry : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
    owner: typeof search.owner === "string" ? search.owner : undefined,
    company: typeof search.company === "string" ? search.company : undefined,
  }),
  component: DashboardPage,
});

const companiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/companies",
  component: CompaniesPage,
});

const companyDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/companies/$companyId",
  component: CompanyDetailPage,
});

const opportunitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities",
  validateSearch: (search: Record<string, unknown>) =>
    parseOpportunitySearch(search),
  component: OpportunitiesPage,
});

const opportunityDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/opportunities/$opportunityId",
  component: OpportunityDetailPage,
});

const personnelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/personnel",
  component: PersonnelPage,
});

const personDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/personnel/$personId",
  component: PersonDetailPage,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: UsersPage,
});

const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/audit",
  component: AuditPage,
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: NotificationsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  companiesRoute,
  companyDetailRoute,
  opportunitiesRoute,
  opportunityDetailRoute,
  personnelRoute,
  personDetailRoute,
  usersRoute,
  auditRoute,
  notificationsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
