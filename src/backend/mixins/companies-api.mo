import Common "../types/common";
import State "../types/state";
import Companies "../types/companies";
import Errors "../types/errors";
import CompaniesLib "../lib/companies";

mixin (state : State.State) {
  /// 管理员 only.
  public shared ({ caller }) func createCompany(input : Companies.CompanyInput) : async Errors.ApiResult<Companies.CompanyView> {
    CompaniesLib.create(state, caller, input);
  };

  /// Requires 编辑 on the company.
  public shared ({ caller }) func updateCompany(id : Common.CompanyId, input : Companies.CompanyInput) : async Errors.ApiResult<Companies.CompanyView> {
    CompaniesLib.update(state, caller, id, input);
  };

  /// Requires 查看; denial is audited.
  public shared ({ caller }) func getCompany(id : Common.CompanyId) : async Errors.ApiResult<Companies.CompanyView> {
    CompaniesLib.get(state, caller, id);
  };

  /// Only companies where the caller has 查看.
  public shared ({ caller }) func listCompanies() : async Errors.ApiResult<[Companies.CompanyView]> {
    CompaniesLib.listVisible(state, caller);
  };
};
