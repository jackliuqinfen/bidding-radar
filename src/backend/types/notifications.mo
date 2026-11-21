import Common "common";

module {
  public type NotificationKind = {
    #pendingUser; // new user awaiting approval (to 管理员)
    #accountApproved;
    #accountRejected;
    #permissionChanged;
    #resetToPending; // to 维护责任人
    #nearExpiry; // to 维护责任人
    #expired; // to 维护责任人
    #verified;
  };

  public type Notification = {
    id : Common.NotificationId;
    recipient : Principal;
    kind : NotificationKind;
    message : Text;
    companyId : ?Common.CompanyId;
    recordId : ?Common.RecordId;
    createdAt : Common.Timestamp;
    read : Bool;
    /// de-duplication key for generated expiry notifications
    dedupKey : ?Text;
  };

  public type NotificationView = {
    id : Common.NotificationId;
    kind : NotificationKind;
    kindLabel : Text;
    message : Text;
    companyId : ?Common.CompanyId;
    recordId : ?Common.RecordId;
    createdAt : Common.Timestamp;
    read : Bool;
  };
};
