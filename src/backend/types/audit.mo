import Common "common";

module {
  public type AuditAction = {
    #signIn;
    #register;
    #approveAccount;
    #approveAsAdmin; // direct approval as 管理员
    #rejectAccount;
    #changeAccountRole;
    #changePermissions;
    #createCompany;
    #editCompany;
    #viewCompany;
    #viewRecord;
    #viewList;
    #viewHistory;
    #viewSensitive; // full ID number
    #createRecord;
    #editRecord;
    #verifyRecord;
    #resetToPending;
    #uploadAttachment;
    #replaceAttachment;
    #downloadAttachment;
    #viewDashboard;
    #viewAuditLog;
    #seedSampleData;
  };

  /// #success = 成功, #denied = 拒绝
  public type AuditResult = { #success; #denied };

  public type AuditEntry = {
    id : Common.AuditId;
    operator : Principal;
    at : Common.Timestamp;
    action : AuditAction;
    target : Text;
    companyId : ?Common.CompanyId;
    result : AuditResult;
    denialReason : ?Text;
  };

  public type AuditEntryView = {
    id : Common.AuditId;
    operator : Principal;
    operatorName : Text;
    at : Common.Timestamp;
    action : AuditAction;
    actionLabel : Text;
    target : Text;
    companyId : ?Common.CompanyId;
    companyName : ?Text;
    result : AuditResult;
    resultLabel : Text;
    denialReason : ?Text;
  };

  public type AuditFilter = {
    operator : ?Principal;
    action : ?AuditAction;
    result : ?AuditResult;
    companyId : ?Common.CompanyId;
    offset : Nat;
    limit : Nat;
  };

  /// Newest first.
  public type AuditPage = {
    total : Nat;
    entries : [AuditEntryView];
  };
};
