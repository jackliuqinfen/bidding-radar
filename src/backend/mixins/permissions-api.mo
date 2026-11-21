import Common "../types/common";
import State "../types/state";
import Permissions "../types/permissions";
import Errors "../types/errors";
import PermissionsLib "../lib/permissions";

mixin (state : State.State) {
  /// 管理员 only: set 查看/编辑/核实/敏感下载 for a user on a company.
  public shared ({ caller }) func setUserCompanyPermissions(user : Principal, companyId : Common.CompanyId, permissions : Common.PermissionSet) : async Errors.ApiResult<Permissions.CompanyPermissionGrant> {
    PermissionsLib.set(state, caller, user, companyId, permissions);
  };

  /// 管理员 only.
  public shared ({ caller }) func getUserPermissions(user : Principal) : async Errors.ApiResult<Permissions.UserPermissions> {
    PermissionsLib.ofUser(state, caller, user);
  };

  /// The caller's own grants.
  public shared ({ caller }) func getMyPermissions() : async Errors.ApiResult<[Permissions.CompanyPermissionGrant]> {
    PermissionsLib.mine(state, caller);
  };
};
