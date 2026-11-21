import Common "common";
import Attachments "attachments";

module {
  /// 证照资质, 企业业绩, 人员, 人员证书, 人员业绩
  public type RecordKind = { #license; #companyTrack; #person; #personCert; #personTrack };

  /// 工程施工, 货物设备, 服务
  public type ProjectType = { #construction; #goodsEquipment; #service };

  /// #missing = 待补, #pendingReview = 待核, #verified = 已核实
  public type RecordStatus = { #missing; #pendingReview; #verified };

  /// Computed markers, not statuses: #nearExpiry = 临近到期 (within 30 days), #expired = 已过期
  public type ExpiryFlag = { #nearExpiry; #expired };

  // Empty Text / null means "unknown" and makes the record 待补.
  public type LicenseData = {
    category : Text;
    name : Text;
    number : Text;
    issuingAuthority : Text;
    validFrom : ?Common.Timestamp;
    validTo : ?Common.Timestamp;
  };

  public type CompanyTrackData = {
    projectName : Text;
    owner : Text;
    projectType : ?ProjectType;
    contractAmountFen : ?Nat; // contract amount in 分
    completionDate : ?Common.Timestamp;
  };

  public type PersonData = {
    name : Text;
    idNumber : Text; // full value stored; masked in every view; masked text is never stored
    phone : Text;
    position : Text;
  };

  public type PersonCertData = {
    personId : Common.RecordId;
    category : Text;
    number : Text;
    issuingAuthority : Text;
    validFrom : ?Common.Timestamp;
    validTo : ?Common.Timestamp;
  };

  public type PersonTrackData = {
    personId : Common.RecordId;
    projectName : Text;
    role : Text;
    completionDate : ?Common.Timestamp;
  };

  public type RecordData = {
    #license : LicenseData;
    #companyTrack : CompanyTrackData;
    #person : PersonData;
    #personCert : PersonCertData;
    #personTrack : PersonTrackData;
  };

  public type Verification = {
    verifier : Principal;
    verifiedAt : Common.Timestamp;
  };

  /// Stored record. Status is computed: missing key data => 待补; else verification present => 已核实; else 待核.
  public type ArchiveRecord = {
    id : Common.RecordId;
    companyId : Common.CompanyId;
    data : RecordData;
    maintainer : Principal; // 维护责任人
    remarks : Text;
    version : Nat;
    verification : ?Verification;
    createdBy : Principal;
    createdAt : Common.Timestamp;
    /// creator or last modifier of the current version (self-verification is denied for both)
    lastModifiedBy : Principal;
    lastModifiedAt : Common.Timestamp;
  };

  public type VerificationView = {
    verifier : Principal;
    verifierName : Text;
    verifiedAt : Common.Timestamp;
  };

  public type RecordView = {
    id : Common.RecordId;
    kind : RecordKind;
    kindLabel : Text;
    companyId : Common.CompanyId;
    companyName : Text;
    /// person.idNumber is always masked here
    data : RecordData;
    title : Text; // short display name derived from data
    maintainer : Principal;
    maintainerName : Text;
    remarks : Text;
    version : Nat;
    status : RecordStatus;
    statusLabel : Text;
    expiryFlag : ?ExpiryFlag;
    expiryLabel : ?Text;
    verification : ?VerificationView;
    createdBy : Principal;
    createdByName : Text;
    createdAt : Common.Timestamp;
    lastModifiedBy : Principal;
    lastModifiedByName : Text;
    lastModifiedAt : Common.Timestamp;
    attachments : [Attachments.AttachmentView];
  };

  public type RecordInput = {
    companyId : Common.CompanyId;
    data : RecordData;
    maintainer : Principal;
    remarks : Text;
  };

  /// idNumber unchanged or masked placeholder keeps the stored value.
  public type RecordUpdate = {
    data : RecordData;
    maintainer : Principal;
    remarks : Text;
  };

  public type RecordFilter = {
    companyId : ?Common.CompanyId;
    kind : ?RecordKind;
    status : ?RecordStatus;
    expiry : ?ExpiryFlag;
    category : ?Text;
    maintainer : ?Principal;
    personId : ?Common.RecordId;
    search : ?Text;
  };

  public type ChangeAction = {
    #create;
    #update;
    #verify;
    #resetToPending;
    #attachmentAdded;
    #attachmentReplaced;
  };

  public type FieldChange = {
    field : Text;
    before : Text; // ID number masked
    after : Text; // ID number masked
  };

  public type ChangeEntry = {
    id : Common.HistoryId;
    recordId : Common.RecordId;
    companyId : Common.CompanyId;
    editor : Principal;
    at : Common.Timestamp;
    resultingVersion : Nat;
    action : ChangeAction;
    changes : [FieldChange];
  };

  public type ChangeEntryView = {
    id : Common.HistoryId;
    recordId : Common.RecordId;
    editor : Principal;
    editorName : Text;
    at : Common.Timestamp;
    resultingVersion : Nat;
    action : ChangeAction;
    actionLabel : Text;
    changes : [FieldChange];
  };
};
