import Map "mo:core/Map";
import Common "../types/common";
import State "../types/state";
import Permissions "../types/permissions";
import Audit "../types/audit";
import Errors "../types/errors";
import Access "access";
import AuditLib "audit";
import NotificationsLib "notifications";
import Labels "labels";

module {
  func grantOf(state : State.State, companyId : Common.CompanyId, permissions : Common.PermissionSet) : Permissions.CompanyPermissionGrant {
    {
      companyId;
      companyName = switch (state.companies.get(companyId)) {
        case (?c) c.name;
        case null "";
      };
      permissions;
      permissionLabels = Labels.permissionLabels(permissions);
    };
  };

  /// 管理员 only. Replaces the user's four independent flags for the company. Audited; notifies the user.
  public func set(state : State.State, caller : Principal, user : Principal, companyId : Common.CompanyId, permissions : Common.PermissionSet) : Errors.ApiResult<Permissions.CompanyPermissionGrant> {
    switch (Access.requireAdmin(state, caller, #changePermissions, "设置公司权限")) {
      case (#err e) #err e;
      case (#ok _) {
        switch (state.companies.get(companyId)) {
          case null {
            AuditLib.log(state, caller, #changePermissions, "公司 #" # companyId.toText(), ?companyId, #denied, ?"公司不存在");
            return #err(#notFound("公司不存在"));
          };
          case (?company) {
            switch (state.accounts.get(user)) {
              case null {
                AuditLib.log(state, caller, #changePermissions, "用户 " # user.toText(), ?companyId, #denied, ?"账号不存在");
                return #err(#notFound("账号不存在"));
              };
              case (?_) {};
            };
            let byCompany = switch (state.permissions.get(user)) {
              case (?m) m;
              case null {
                let m = Map.empty<Common.CompanyId, Common.PermissionSet>();
                state.permissions.add(user, m);
                m;
              };
            };
            byCompany.add(companyId, permissions);
            AuditLib.log(state, caller, #changePermissions, company.name, ?companyId, #success, null);
            let labels = Labels.permissionLabels(permissions);
            let labelText = if (labels.size() == 0) "无" else labels.values().join("、");
            NotificationsLib.notify(
              state,
              user,
              #permissionChanged,
              "您在【" # company.name # "】的权限已更新为：" # labelText # "。",
              ?companyId,
              null,
              null,
              null,
            );
            #ok(grantOf(state, companyId, permissions));
          };
        };
      };
    };
  };

  /// 管理员 only: one user's grants across all companies.
  public func ofUser(state : State.State, caller : Principal, user : Principal) : Errors.ApiResult<Permissions.UserPermissions> {
    switch (Access.requireAdmin(state, caller, #viewList, "查看用户权限")) {
      case (#err e) #err e;
      case (#ok _) {
        let displayName = Access.displayName(state, user);
        let grants = switch (state.permissions.get(user)) {
          case (?byCompany) {
            let entries = byCompany.entries().toArray();
            let sorted = entries.sort(func (a : (Common.CompanyId, Common.PermissionSet), b : (Common.CompanyId, Common.PermissionSet)) : { #less; #equal; #greater } {
              if (a.0 < b.0) #less else if (a.0 > b.0) #greater else #equal;
            });
            sorted.map(func ((companyId, permissions) : (Common.CompanyId, Common.PermissionSet)) : Permissions.CompanyPermissionGrant {
              grantOf(state, companyId, permissions);
            });
          };
          case null [];
        };
        #ok({ user; displayName; grants });
      };
    };
  };

  /// The caller's own grants across all companies.
  public func mine(state : State.State, caller : Principal) : Errors.ApiResult<[Permissions.CompanyPermissionGrant]> {
    switch (Access.requireApproved(state, caller, #viewList, "查看我的权限", null)) {
      case (#err e) #err e;
      case (#ok _) {
        let grants = switch (state.permissions.get(caller)) {
          case (?byCompany) {
            let entries = byCompany.entries().toArray();
            let sorted = entries.sort(func (a : (Common.CompanyId, Common.PermissionSet), b : (Common.CompanyId, Common.PermissionSet)) : { #less; #equal; #greater } {
              if (a.0 < b.0) #less else if (a.0 > b.0) #greater else #equal;
            });
            sorted.map(func ((companyId, permissions) : (Common.CompanyId, Common.PermissionSet)) : Permissions.CompanyPermissionGrant {
              grantOf(state, companyId, permissions);
            });
          };
          case null [];
        };
        #ok(grants);
      };
    };
  };
};
