import Map "mo:core/Map";
import List "mo:core/List";
import AccessControl "mo:caffeineai-authorization/access-control";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  type ApprovalState = { #pending; #approved; #rejected };

  type Account = {
    principal : Principal;
    displayName : Text;
    approval : ApprovalState;
    registeredAt : Int;
    decidedAt : ?Int;
    decidedBy : ?Principal;
  };

  type PermissionSet = {
    view : Bool;
    edit : Bool;
    verify : Bool;
    sensitiveDownload : Bool;
  };

  type Company = {
    id : Nat;
    name : Text;
    creditCode : Text;
    registeredPlace : Text;
    contact : Text;
    maintainer : Principal;
    createdAt : Int;
    createdBy : Principal;
    updatedAt : Int;
    updatedBy : Principal;
  };

  type ProjectType = { #construction; #goodsEquipment; #service };

  type RecordData = {
    #license : {
      category : Text;
      name : Text;
      number : Text;
      issuingAuthority : Text;
      validFrom : ?Int;
      validTo : ?Int;
    };
    #companyTrack : {
      projectName : Text;
      owner : Text;
      projectType : ?ProjectType;
      contractAmountFen : ?Nat;
      completionDate : ?Int;
    };
    #person : {
      name : Text;
      idNumber : Text;
      phone : Text;
      position : Text;
    };
    #personCert : {
      personId : Nat;
      category : Text;
      number : Text;
      issuingAuthority : Text;
      validFrom : ?Int;
      validTo : ?Int;
    };
    #personTrack : {
      personId : Nat;
      projectName : Text;
      role : Text;
      completionDate : ?Int;
    };
  };

  type ArchiveRecord = {
    id : Nat;
    companyId : Nat;
    data : RecordData;
    maintainer : Principal;
    remarks : Text;
    version : Nat;
    verification : ?{ verifier : Principal; verifiedAt : Int };
    createdBy : Principal;
    createdAt : Int;
    lastModifiedBy : Principal;
    lastModifiedAt : Int;
  };

  type AttachmentVersion = {
    version : Nat;
    blob : Storage.ExternalBlob;
    uploader : Principal;
    uploadedAt : Int;
    fileName : Text;
    note : Text;
    isSample : Bool;
  };

  type Attachment = {
    id : Nat;
    recordId : Nat;
    companyId : Nat;
    sensitive : Bool;
    createdAt : Int;
    versions : [AttachmentVersion];
  };

  type ChangeAction = {
    #create;
    #update;
    #verify;
    #resetToPending;
    #attachmentAdded;
    #attachmentReplaced;
  };

  type ChangeEntry = {
    id : Nat;
    recordId : Nat;
    companyId : Nat;
    editor : Principal;
    at : Int;
    resultingVersion : Nat;
    action : ChangeAction;
    changes : [{ field : Text; before : Text; after : Text }];
  };

  type AuditAction = {
    #signIn;
    #register;
    #approveAccount;
    #approveAsAdmin;
    #rejectAccount;
    #changeAccountRole;
    #changePermissions;
    #createCompany;
    #editCompany;
    #viewCompany;
    #viewRecord;
    #viewList;
    #viewHistory;
    #viewSensitive;
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

  type AuditEntry = {
    id : Nat;
    operator : Principal;
    at : Int;
    action : AuditAction;
    target : Text;
    companyId : ?Nat;
    result : { #success; #denied };
    denialReason : ?Text;
  };

  type NotificationKind = {
    #pendingUser;
    #accountApproved;
    #accountRejected;
    #permissionChanged;
    #resetToPending;
    #nearExpiry;
    #expired;
    #verified;
  };

  type Notification = {
    id : Nat;
    recipient : Principal;
    kind : NotificationKind;
    message : Text;
    companyId : ?Nat;
    recordId : ?Nat;
    createdAt : Int;
    read : Bool;
    dedupKey : ?Text;
  };

  type Counters = {
    var nextCompanyId : Nat;
    var nextRecordId : Nat;
    var nextAttachmentId : Nat;
    var nextHistoryId : Nat;
    var nextAuditId : Nat;
    var nextNotificationId : Nat;
    var sampleSeeded : Bool;
  };

  public type OldActor = {};

  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    accounts : Map.Map<Principal, Account>;
    permissions : Map.Map<Principal, Map.Map<Nat, PermissionSet>>;
    companies : Map.Map<Nat, Company>;
    records : Map.Map<Nat, ArchiveRecord>;
    attachments : Map.Map<Nat, Attachment>;
    history : List.List<ChangeEntry>;
    auditLog : List.List<AuditEntry>;
    notifications : Map.Map<Nat, Notification>;
    counters : Counters;
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      accounts = Map.empty();
      permissions = Map.empty();
      companies = Map.empty();
      records = Map.empty();
      attachments = Map.empty();
      history = List.empty();
      auditLog = List.empty();
      notifications = Map.empty();
      counters = {
        var nextCompanyId = 1;
        var nextRecordId = 1;
        var nextAttachmentId = 1;
        var nextHistoryId = 1;
        var nextAuditId = 1;
        var nextNotificationId = 1;
        var sampleSeeded = false;
      };
    };
  };
};
