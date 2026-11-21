import List "mo:core/List";
import Time "mo:core/Time";
import Common "../types/common";
import State "../types/state";
import Audit "../types/audit";
import Labels "labels";

module {
  /// Appends one entry (success or denied). Never traps.
  public func log(state : State.State, operator : Principal, action : Audit.AuditAction, target : Text, companyId : ?Common.CompanyId, result : Audit.AuditResult, denialReason : ?Text) {
    let id = state.counters.nextAuditId;
    state.counters.nextAuditId := id + 1;
    state.auditLog.add({
      id;
      operator;
      at = Time.now();
      action;
      target;
      companyId;
      result;
      denialReason;
    });
  };

  /// Newest first, filtered; caller must already be verified as 管理员.
  public func list(state : State.State, filter : Audit.AuditFilter) : Audit.AuditPage {
    let all = state.auditLog.toArray();
    let matched = all.filter(func (e : Audit.AuditEntry) : Bool {
      let okOperator = switch (filter.operator) {
        case (?p) Principal.equal(p, e.operator);
        case null true;
      };
      let okAction = switch (filter.action) {
        case (?a) a == e.action;
        case null true;
      };
      let okResult = switch (filter.result) {
        case (?r) r == e.result;
        case null true;
      };
      let okCompany = switch (filter.companyId) {
        case (?c) e.companyId == ?c;
        case null true;
      };
      okOperator and okAction and okResult and okCompany;
    });
    let total = matched.size();
    let newestFirst = matched.reverse();
    let page = newestFirst.sliceToArray(filter.offset, Nat.min(filter.offset + filter.limit, total));
    {
      total;
      entries = page.map(func (e : Audit.AuditEntry) : Audit.AuditEntryView {
        {
          id = e.id;
          operator = e.operator;
          operatorName = switch (state.accounts.get(e.operator)) {
            case (?a) a.displayName;
            case null "";
          };
          at = e.at;
          action = e.action;
          actionLabel = Labels.auditActionLabel(e.action);
          target = e.target;
          companyId = e.companyId;
          companyName = switch (e.companyId) {
            case (?c) switch (state.companies.get(c)) {
              case (?co) ?co.name;
              case null null;
            };
            case null null;
          };
          result = e.result;
          resultLabel = Labels.auditResultLabel(e.result);
          denialReason = e.denialReason;
        };
      });
    };
  };
};
