import State "../types/state";
import Audit "../types/audit";
import Errors "../types/errors";
import Access "../lib/access";
import AuditLib "../lib/audit";

mixin (state : State.State) {
  /// 管理员 only; filter by operator, action, result and company.
  public shared ({ caller }) func listAuditLog(filter : Audit.AuditFilter) : async Errors.ApiResult<Audit.AuditPage> {
    switch (Access.requireAdmin(state, caller, #viewAuditLog, "审计日志")) {
      case (#err e) #err e;
      case (#ok _) {
        AuditLib.log(state, caller, #viewAuditLog, "审计日志", null, #success, null);
        #ok(AuditLib.list(state, filter));
      };
    };
  };
};
