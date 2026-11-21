module {
  /// Nanoseconds since the Unix epoch (Time.now()). Dates (valid from/to, completion) are UTC-midnight nanoseconds.
  public type Timestamp = Int;

  public type CompanyId = Nat;
  public type RecordId = Nat;
  public type AttachmentId = Nat;
  public type NotificationId = Nat;
  public type AuditId = Nat;
  public type HistoryId = Nat;
  public type OpportunityId = Nat;
  public type CheckItemId = Nat;
  public type StatusChangeId = Nat;

  /// 查看, 编辑, 核实, 敏感下载 (independent, none implies another)
  public type Permission = { #view; #edit; #verify; #sensitiveDownload };

  public type PermissionSet = {
    view : Bool;
    edit : Bool;
    verify : Bool;
    sensitiveDownload : Bool;
  };
};
