import Common "../types/common";
import State "../types/state";
import Opportunities "../types/opportunities";
import Errors "../types/errors";
import OpportunitiesLib "../lib/opportunities";

mixin (state : State.State) {
  /// Requires 编辑 on the company; body and source URL required. Saves as draft (creator-only).
  public shared ({ caller }) func createOpportunityDraft(input : Opportunities.OpportunityInput) : async Errors.ApiResult<Opportunities.OpportunityView> {
    OpportunitiesLib.createDraft(state, caller, input);
  };

  /// Creator only, draft only. Requires 编辑 on the company.
  public shared ({ caller }) func updateOpportunityDraft(id : Common.OpportunityId, change : Opportunities.OpportunityUpdate) : async Errors.ApiResult<Opportunities.OpportunityView> {
    OpportunitiesLib.updateDraft(state, caller, id, change);
  };

  /// Creator only; moves a draft into the opportunity pool (待核对).
  public shared ({ caller }) func submitOpportunity(id : Common.OpportunityId) : async Errors.ApiResult<Opportunities.OpportunityView> {
    OpportunitiesLib.submit(state, caller, id);
  };

  /// Requires a reason; 已选公司参投 requires at least one 符合 check item.
  public shared ({ caller }) func changeOpportunityStatus(id : Common.OpportunityId, toStatus : Opportunities.OpportunityStatus, reason : Text) : async Errors.ApiResult<Opportunities.OpportunityView> {
    OpportunitiesLib.changeStatus(state, caller, id, toStatus, reason);
  };

  /// Approved members; drafts visible only to their creator.
  public shared ({ caller }) func getOpportunity(id : Common.OpportunityId) : async Errors.ApiResult<Opportunities.OpportunityView> {
    OpportunitiesLib.get(state, caller, id);
  };

  /// Approved members; drafts excluded except the caller's own. Filtered and sorted.
  public shared ({ caller }) func listOpportunities(filter : Opportunities.OpportunityFilter) : async Errors.ApiResult<[Opportunities.OpportunityListItem]> {
    OpportunitiesLib.list(state, caller, filter);
  };

  /// Status change history for an announcement.
  public shared ({ caller }) func getOpportunityStatusHistory(id : Common.OpportunityId) : async Errors.ApiResult<[Opportunities.StatusChangeView]> {
    OpportunitiesLib.statusHistory(state, caller, id);
  };

  /// Requires 编辑 on the company; 符合 cannot cite a 待核/待补 record.
  public shared ({ caller }) func createCheckItem(input : Opportunities.CheckItemInput) : async Errors.ApiResult<Opportunities.CheckItemView> {
    OpportunitiesLib.createCheckItem(state, caller, input);
  };

  /// Requires 编辑 on the company; confirmed items are immutable.
  public shared ({ caller }) func updateCheckItem(id : Common.CheckItemId, change : Opportunities.CheckItemUpdate) : async Errors.ApiResult<Opportunities.CheckItemView> {
    OpportunitiesLib.updateCheckItem(state, caller, id, change);
  };

  /// Requires 核实 on the company; creator cannot confirm their own item.
  public shared ({ caller }) func confirmCheckItem(id : Common.CheckItemId) : async Errors.ApiResult<Opportunities.CheckItemView> {
    OpportunitiesLib.confirmCheckItem(state, caller, id);
  };

  /// Check items for an announcement; evidence only with 查看 on that company.
  public shared ({ caller }) func listCheckItems(opportunityId : Common.OpportunityId) : async Errors.ApiResult<[Opportunities.CheckItemView]> {
    OpportunitiesLib.listCheckItems(state, caller, opportunityId);
  };

  /// 机会池待办: announcements closing within 7 days and unconfirmed check items.
  public shared ({ caller }) func getOpportunityTodo() : async Errors.ApiResult<Opportunities.OpportunityTodo> {
    OpportunitiesLib.todo(state, caller);
  };
};
