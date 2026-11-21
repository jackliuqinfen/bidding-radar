import Map "mo:core/Map";
import List "mo:core/List";
import AccessControl "mo:caffeineai-authorization/access-control";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  // ---------- deployed baseline (00000000_000000) ----------

  type OldApprovalState = { #pending; #approved; #rejected };

  type OldAccount = {
    principal : Principal;
    displayName : Text;
    approval : OldApprovalState;
    registeredAt : Int;
    decidedAt : ?Int;
    decidedBy : ?Principal;
  };

  type OldPermissionSet = {
    view : Bool;
    edit : Bool;
    verify : Bool;
    sensitiveDownload : Bool;
  };

  type OldCompany = {
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

  type OldProjectType = { #construction; #goodsEquipment; #service };

  type OldRecordData = {
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
      projectType : ?OldProjectType;
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

  type OldArchiveRecord = {
    id : Nat;
    companyId : Nat;
    data : OldRecordData;
    maintainer : Principal;
    remarks : Text;
    version : Nat;
    verification : ?{ verifier : Principal; verifiedAt : Int };
    createdBy : Principal;
    createdAt : Int;
    lastModifiedBy : Principal;
    lastModifiedAt : Int;
  };

  type OldAttachmentVersion = {
    version : Nat;
    blob : Storage.ExternalBlob;
    uploader : Principal;
    uploadedAt : Int;
    fileName : Text;
    note : Text;
    isSample : Bool;
  };

  type OldAttachment = {
    id : Nat;
    recordId : Nat;
    companyId : Nat;
    sensitive : Bool;
    createdAt : Int;
    versions : [OldAttachmentVersion];
  };

  type OldChangeAction = {
    #create;
    #update;
    #verify;
    #resetToPending;
    #attachmentAdded;
    #attachmentReplaced;
  };

  type OldChangeEntry = {
    id : Nat;
    recordId : Nat;
    companyId : Nat;
    editor : Principal;
    at : Int;
    resultingVersion : Nat;
    action : OldChangeAction;
    changes : [{ field : Text; before : Text; after : Text }];
  };

  type OldAuditAction = {
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

  type OldAuditEntry = {
    id : Nat;
    operator : Principal;
    at : Int;
    action : OldAuditAction;
    target : Text;
    companyId : ?Nat;
    result : { #success; #denied };
    denialReason : ?Text;
  };

  type OldNotificationKind = {
    #pendingUser;
    #accountApproved;
    #accountRejected;
    #permissionChanged;
    #resetToPending;
    #nearExpiry;
    #expired;
    #verified;
  };

  type OldNotification = {
    id : Nat;
    recipient : Principal;
    kind : OldNotificationKind;
    message : Text;
    companyId : ?Nat;
    recordId : ?Nat;
    createdAt : Int;
    read : Bool;
    dedupKey : ?Text;
  };

  type OldCounters = {
    var nextCompanyId : Nat;
    var nextRecordId : Nat;
    var nextAttachmentId : Nat;
    var nextHistoryId : Nat;
    var nextAuditId : Nat;
    var nextNotificationId : Nat;
    var sampleSeeded : Bool;
  };

  public type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    accounts : Map.Map<Principal, OldAccount>;
    permissions : Map.Map<Principal, Map.Map<Nat, OldPermissionSet>>;
    companies : Map.Map<Nat, OldCompany>;
    records : Map.Map<Nat, OldArchiveRecord>;
    attachments : Map.Map<Nat, OldAttachment>;
    history : List.List<OldChangeEntry>;
    auditLog : List.List<OldAuditEntry>;
    notifications : Map.Map<Nat, OldNotification>;
    counters : OldCounters;
  };

  // ---------- current types ----------

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
    #createOpportunity;
    #submitOpportunity;
    #changeOpportunityStatus;
    #createCheckItem;
    #editCheckItem;
    #confirmCheckItem;
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
    #checkItemConfirmed;
  };

  type Notification = {
    id : Nat;
    recipient : Principal;
    kind : NotificationKind;
    message : Text;
    companyId : ?Nat;
    recordId : ?Nat;
    opportunityId : ?Nat;
    createdAt : Int;
    read : Bool;
    dedupKey : ?Text;
  };

  type OpportunityStatus = { #pendingReview; #selected; #declined; #closed };

  type ClauseKind = { #qualification; #performance; #personnel; #deposit };

  type Clause = { kind : ClauseKind; excerpt : Text };

  type CheckConclusion = { #conform; #nonConform; #pending };

  type CheckItemKind = {
    #qualification;
    #performance;
    #personnel;
    #capital;
    #deposit;
    #other;
  };

  type RecordStatus = { #missing; #pendingReview; #verified };

  type EvidenceRef = { recordId : Nat; statusAtCitation : RecordStatus };

  type Opportunity = {
    id : Nat;
    projectName : Text;
    tenderer : Text;
    projectType : ProjectType;
    sourceName : Text;
    sourceUrl : Text;
    publishDate : Int;
    registrationDeadline : Int;
    bidOpenTime : Int;
    budgetYuan : ?Nat;
    body : Text;
    clauses : [Clause];
    status : OpportunityStatus;
    draft : Bool;
    createdBy : Principal;
    createdAt : Int;
    lastModifiedBy : Principal;
    lastModifiedAt : Int;
  };

  type Confirmation = { confirmer : Principal; confirmedAt : Int };

  type CheckItem = {
    id : Nat;
    opportunityId : Nat;
    companyId : Nat;
    kind : CheckItemKind;
    clauseExcerpt : Text;
    conclusion : CheckConclusion;
    basis : Text;
    evidence : [EvidenceRef];
    createdBy : Principal;
    createdAt : Int;
    lastModifiedBy : Principal;
    lastModifiedAt : Int;
    confirmation : ?Confirmation;
  };

  type StatusChange = {
    id : Nat;
    opportunityId : Nat;
    fromStatus : OpportunityStatus;
    toStatus : OpportunityStatus;
    reason : Text;
    operator : Principal;
    at : Int;
  };

  type Counters = {
    var nextCompanyId : Nat;
    var nextRecordId : Nat;
    var nextAttachmentId : Nat;
    var nextHistoryId : Nat;
    var nextAuditId : Nat;
    var nextNotificationId : Nat;
    var nextOpportunityId : Nat;
    var nextCheckItemId : Nat;
    var nextStatusChangeId : Nat;
    var sampleSeeded : Bool;
  };

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
    opportunities : Map.Map<Nat, Opportunity>;
    checkItems : Map.Map<Nat, CheckItem>;
    statusChanges : List.List<StatusChange>;
    counters : Counters;
  };

  // ---------- conversions ----------

  func convertAuditAction(a : OldAuditAction) : AuditAction {
    switch (a) {
      case (#signIn) #signIn;
      case (#register) #register;
      case (#approveAccount) #approveAccount;
      case (#approveAsAdmin) #approveAsAdmin;
      case (#rejectAccount) #rejectAccount;
      case (#changeAccountRole) #changeAccountRole;
      case (#changePermissions) #changePermissions;
      case (#createCompany) #createCompany;
      case (#editCompany) #editCompany;
      case (#viewCompany) #viewCompany;
      case (#viewRecord) #viewRecord;
      case (#viewList) #viewList;
      case (#viewHistory) #viewHistory;
      case (#viewSensitive) #viewSensitive;
      case (#createRecord) #createRecord;
      case (#editRecord) #editRecord;
      case (#verifyRecord) #verifyRecord;
      case (#resetToPending) #resetToPending;
      case (#uploadAttachment) #uploadAttachment;
      case (#replaceAttachment) #replaceAttachment;
      case (#downloadAttachment) #downloadAttachment;
      case (#viewDashboard) #viewDashboard;
      case (#viewAuditLog) #viewAuditLog;
      case (#seedSampleData) #seedSampleData;
    };
  };

  func convertAuditEntry(e : OldAuditEntry) : AuditEntry {
    {
      id = e.id;
      operator = e.operator;
      at = e.at;
      action = convertAuditAction(e.action);
      target = e.target;
      companyId = e.companyId;
      result = e.result;
      denialReason = e.denialReason;
    };
  };

  func convertNotificationKind(k : OldNotificationKind) : NotificationKind {
    switch (k) {
      case (#pendingUser) #pendingUser;
      case (#accountApproved) #accountApproved;
      case (#accountRejected) #accountRejected;
      case (#permissionChanged) #permissionChanged;
      case (#resetToPending) #resetToPending;
      case (#nearExpiry) #nearExpiry;
      case (#expired) #expired;
      case (#verified) #verified;
    };
  };

  func convertNotification(n : OldNotification) : Notification {
    {
      id = n.id;
      recipient = n.recipient;
      kind = convertNotificationKind(n.kind);
      message = n.message;
      companyId = n.companyId;
      recordId = n.recordId;
      opportunityId = null;
      createdAt = n.createdAt;
      read = n.read;
      dedupKey = n.dedupKey;
    };
  };

  public func migration(old : OldActor) : NewActor {
    let auditLog = List.empty<AuditEntry>();
    for (e in old.auditLog.values()) {
      auditLog.add(convertAuditEntry(e));
    };
    let notifications = Map.empty<Nat, Notification>();
    for ((k, n) in old.notifications.entries()) {
      notifications.add(k, convertNotification(n));
    };
    {
      accessControlState = old.accessControlState;
      accounts = old.accounts;
      permissions = old.permissions;
      companies = old.companies;
      records = old.records;
      attachments = old.attachments;
      history = old.history;
      auditLog;
      notifications;
      opportunities = Map.empty();
      checkItems = Map.empty();
      statusChanges = List.empty();
      counters = {
        var nextCompanyId = old.counters.nextCompanyId;
        var nextRecordId = old.counters.nextRecordId;
        var nextAttachmentId = old.counters.nextAttachmentId;
        var nextHistoryId = old.counters.nextHistoryId;
        var nextAuditId = old.counters.nextAuditId;
        var nextNotificationId = old.counters.nextNotificationId;
        var nextOpportunityId = 1;
        var nextCheckItemId = 1;
        var nextStatusChangeId = 1;
        var sampleSeeded = old.counters.sampleSeeded;
      };
    };
  };
};
