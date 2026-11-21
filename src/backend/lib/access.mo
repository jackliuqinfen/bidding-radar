import Map "mo:core/Map";
import Common "../types/common";
import State "../types/state";
import Audit "../types/audit";
import Errors "../types/errors";
import AuditLib "audit";
import Labels "labels";

/// Authorization gates. A failed gate writes a denied audit entry (in the same message) and returns the error,
/// so callers must return the error instead of trapping.
module {
  public func isAdmin(state : State.State, user : Principal) : Bool {
    switch (state.accessControlState.userRoles.get(user)) {
      case (?#admin) true;
      case _ false;
    };
  };

  public func isApproved(state : State.State, user : Principal) : Bool {
    switch (state.accounts.get(user)) {
      case (?a) a.approval == #approved;
      case null false;
    };
  };

  /// Raw permission lookup; the account role 管理员 never grants anything here.
  public func hasPermission(state : State.State, user : Principal, companyId : Common.CompanyId, permission : Common.Permission) : Bool {
    switch (state.permissions.get(user)) {
      case (?byCompany) {
        switch (byCompany.get(companyId)) {
          case (?set) {
            switch (permission) {
              case (#view) set.view;
              case (#edit) set.edit;
              case (#verify) set.verify;
              case (#sensitiveDownload) set.sensitiveDownload;
            };
          };
          case null false;
        };
      };
      case null false;
    };
  };

  public func displayName(state : State.State, user : Principal) : Text {
    switch (state.accounts.get(user)) {
      case (?a) a.displayName;
      case null "";
    };
  };

  /// Signed in, registered and approved; otherwise audit denial and return #notSignedIn/#notRegistered/#pendingApproval/#accountRejected.
  public func requireApproved(state : State.State, caller : Principal, action : Audit.AuditAction, target : Text, companyId : ?Common.CompanyId) : Errors.ApiResult<()> {
    if (caller.isAnonymous()) {
      AuditLib.log(state, caller, action, target, companyId, #denied, ?"未登录");
      return #err(#notSignedIn);
    };
    switch (state.accounts.get(caller)) {
      case null {
        AuditLib.log(state, caller, action, target, companyId, #denied, ?"未注册");
        #err(#notRegistered);
      };
      case (?a) {
        switch (a.approval) {
          case (#approved) #ok(());
          case (#pending) {
            AuditLib.log(state, caller, action, target, companyId, #denied, ?"账号待批准");
            #err(#pendingApproval);
          };
          case (#rejected) {
            AuditLib.log(state, caller, action, target, companyId, #denied, ?"账号已拒绝");
            #err(#accountRejected);
          };
        };
      };
    };
  };

  /// Approved and account role 管理员; otherwise audit denial and return #adminOnly (or an approval error).
  public func requireAdmin(state : State.State, caller : Principal, action : Audit.AuditAction, target : Text) : Errors.ApiResult<()> {
    switch (requireApproved(state, caller, action, target, null)) {
      case (#err e) #err e;
      case (#ok _) {
        if (isAdmin(state, caller)) {
          #ok(());
        } else {
          AuditLib.log(state, caller, action, target, null, #denied, ?"需要管理员角色");
          #err(#adminOnly);
        };
      };
    };
  };

  /// Approved and holding `permission` on the company; otherwise audit denial and return #permissionDenied.
  public func requirePermission(state : State.State, caller : Principal, companyId : Common.CompanyId, permission : Common.Permission, action : Audit.AuditAction, target : Text) : Errors.ApiResult<()> {
    switch (requireApproved(state, caller, action, target, ?companyId)) {
      case (#err e) #err e;
      case (#ok _) {
        if (hasPermission(state, caller, companyId, permission)) {
          #ok(());
        } else {
          let permLabel = Labels.permissionLabel(permission);
          let reason = "缺少" # permLabel # "权限";
          AuditLib.log(state, caller, action, target, ?companyId, #denied, ?reason);
          #err(#permissionDenied({ companyId; permission; message = reason }));
        };
      };
    };
  };
};
