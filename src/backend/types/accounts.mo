import Common "common";

module {
  /// #admin = 管理员, #member = 成员
  public type AccountRole = { #admin; #member };

  /// #pending = 待批准, #approved = 已批准, #rejected = 已拒绝
  public type ApprovalState = { #pending; #approved; #rejected };

  /// Stored account. The role lives in the authorization component's state.
  public type Account = {
    principal : Principal;
    displayName : Text;
    approval : ApprovalState;
    registeredAt : Common.Timestamp;
    decidedAt : ?Common.Timestamp;
    decidedBy : ?Principal;
  };

  public type AccountView = {
    principal : Principal;
    displayName : Text;
    role : AccountRole;
    roleLabel : Text;
    approval : ApprovalState;
    approvalLabel : Text;
    registeredAt : Common.Timestamp;
    decidedAt : ?Common.Timestamp;
    decidedByName : ?Text;
  };
};
