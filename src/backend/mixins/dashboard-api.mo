import Common "../types/common";
import State "../types/state";
import Records "../types/records";
import Dashboard "../types/dashboard";
import Errors "../types/errors";
import DashboardLib "../lib/dashboard";

mixin (state : State.State) {
  /// Every company by name with counts only (zeros when empty). Also triggers expiry notifications.
  public shared ({ caller }) func getGapDashboard() : async Errors.ApiResult<[Dashboard.CompanyGapRow]> {
    DashboardLib.gapRows(state, caller);
  };

  /// Records need 查看; without it only counts are returned.
  public shared ({ caller }) func getCompanyDetail(companyId : Common.CompanyId, filter : Records.RecordFilter) : async Errors.ApiResult<Dashboard.CompanyDetail> {
    DashboardLib.companyDetail(state, caller, companyId, filter);
  };

  /// Role home data. Also triggers expiry notifications.
  public shared ({ caller }) func getHomeSummary() : async Errors.ApiResult<Dashboard.HomeSummary> {
    DashboardLib.home(state, caller);
  };
};
