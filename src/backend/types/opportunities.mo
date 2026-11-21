import Common "common";
import Records "records";

module {
  /// 工程施工, 货物设备, 服务
  public type ProjectType = Records.ProjectType;

  /// 待核对, 已选公司参投, 不参与, 已截止
  public type OpportunityStatus = { #pendingReview; #selected; #declined; #closed };

  /// 资格要求, 业绩要求, 人员要求, 保证金要求
  public type ClauseKind = { #qualification; #performance; #personnel; #deposit };

  /// A highlighted clause inside the announcement body, quoted for later verification.
  public type Clause = {
    kind : ClauseKind;
    /// exact excerpt from the announcement body
    excerpt : Text;
  };

  /// 符合, 不符合, 待核
  public type CheckConclusion = { #conform; #nonConform; #pending };

  /// 资质类别与等级, 类似业绩, 人员与证书, 注册资本/信用, 保证金能力, 其他公告条款
  public type CheckItemKind = {
    #qualification;
    #performance;
    #personnel;
    #capital;
    #deposit;
    #other;
  };

  /// A company archive record cited as evidence, with its status at citation time.
  public type EvidenceRef = {
    recordId : Common.RecordId;
    /// status snapshot at citation time: 待补 / 待核 / 已核实
    statusAtCitation : Records.RecordStatus;
  };

  /// One qualification check line for a company against an announcement.
  public type CheckItem = {
    id : Nat;
    opportunityId : Common.OpportunityId;
    companyId : Common.CompanyId;
    kind : CheckItemKind;
    /// the announcement clause this item verifies (excerpt)
    clauseExcerpt : Text;
    conclusion : CheckConclusion;
    /// required basis explanation
    basis : Text;
    /// cited company archive records
    evidence : [EvidenceRef];
    createdBy : Principal;
    createdAt : Common.Timestamp;
    lastModifiedBy : Principal;
    lastModifiedAt : Common.Timestamp;
    /// set once confirmed by a member with 核实
    confirmation : ?Confirmation;
  };

  public type Confirmation = {
    confirmer : Principal;
    confirmedAt : Common.Timestamp;
  };

  /// Stored announcement.
  public type Opportunity = {
    id : Common.OpportunityId;
    projectName : Text;
    tenderer : Text;
    projectType : ProjectType;
    sourceName : Text;
    sourceUrl : Text;
    publishDate : Common.Timestamp;
    registrationDeadline : Common.Timestamp;
    bidOpenTime : Common.Timestamp;
    budgetYuan : ?Nat;
    /// announcement body, paragraphs and lists preserved
    body : Text;
    clauses : [Clause];
    status : OpportunityStatus;
    /// draft is visible/editable only to its creator
    draft : Bool;
    createdBy : Principal;
    createdAt : Common.Timestamp;
    lastModifiedBy : Principal;
    lastModifiedAt : Common.Timestamp;
  };

  public type StatusChange = {
    id : Nat;
    opportunityId : Common.OpportunityId;
    fromStatus : OpportunityStatus;
    toStatus : OpportunityStatus;
    reason : Text;
    operator : Principal;
    at : Common.Timestamp;
  };

  public type OpportunityInput = {
    projectName : Text;
    tenderer : Text;
    projectType : ProjectType;
    sourceName : Text;
    sourceUrl : Text;
    publishDate : Common.Timestamp;
    registrationDeadline : Common.Timestamp;
    bidOpenTime : Common.Timestamp;
    budgetYuan : ?Nat;
    body : Text;
    clauses : [Clause];
  };

  public type OpportunityUpdate = OpportunityInput;

  public type OpportunityView = {
    id : Common.OpportunityId;
    projectName : Text;
    tenderer : Text;
    projectType : ProjectType;
    projectTypeLabel : Text;
    sourceName : Text;
    sourceUrl : Text;
    publishDate : Common.Timestamp;
    registrationDeadline : Common.Timestamp;
    bidOpenTime : Common.Timestamp;
    budgetYuan : ?Nat;
    body : Text;
    clauses : [Clause];
    status : OpportunityStatus;
    statusLabel : Text;
    draft : Bool;
    createdBy : Principal;
    createdByName : Text;
    createdAt : Common.Timestamp;
    lastModifiedBy : Principal;
    lastModifiedByName : Text;
    lastModifiedAt : Common.Timestamp;
    /// days remaining until registration deadline (0 when passed)
    daysRemaining : Nat;
    /// number of companies with at least one check item
    checkedCompanyCount : Nat;
  };

  public type OpportunityListItem = {
    id : Common.OpportunityId;
    projectName : Text;
    tenderer : Text;
    projectType : ProjectType;
    projectTypeLabel : Text;
    registrationDeadline : Common.Timestamp;
    daysRemaining : Nat;
    budgetYuan : ?Nat;
    status : OpportunityStatus;
    statusLabel : Text;
    checkedCompanyCount : Nat;
  };

  public type OpportunityFilter = {
    projectType : ?ProjectType;
    status : ?OpportunityStatus;
    /// registration deadline range (inclusive), nanoseconds
    deadlineFrom : ?Common.Timestamp;
    deadlineTo : ?Common.Timestamp;
    /// matches project name or tenderer
    search : ?Text;
    /// #deadline = 报名截止时间, #createdAt = 录入时间
    sortBy : ?SortField;
    descending : Bool;
  };

  public type SortField = { #deadline; #createdAt };

  public type CheckItemInput = {
    opportunityId : Common.OpportunityId;
    companyId : Common.CompanyId;
    kind : CheckItemKind;
    clauseExcerpt : Text;
    conclusion : CheckConclusion;
    basis : Text;
    evidence : [EvidenceRef];
  };

  public type CheckItemUpdate = {
    kind : CheckItemKind;
    clauseExcerpt : Text;
    conclusion : CheckConclusion;
    basis : Text;
    evidence : [EvidenceRef];
  };

  public type CheckItemView = {
    id : Nat;
    opportunityId : Common.OpportunityId;
    companyId : Common.CompanyId;
    companyName : Text;
    kind : CheckItemKind;
    kindLabel : Text;
    clauseExcerpt : Text;
    conclusion : CheckConclusion;
    conclusionLabel : Text;
    basis : Text;
    evidence : [EvidenceRef];
    createdBy : Principal;
    createdByName : Text;
    createdAt : Common.Timestamp;
    lastModifiedBy : Principal;
    lastModifiedByName : Text;
    lastModifiedAt : Common.Timestamp;
    confirmation : ?ConfirmationView;
  };

  public type ConfirmationView = {
    confirmer : Principal;
    confirmerName : Text;
    confirmedAt : Common.Timestamp;
  };

  public type StatusChangeView = {
    id : Nat;
    fromStatus : OpportunityStatus;
    fromStatusLabel : Text;
    toStatus : OpportunityStatus;
    toStatusLabel : Text;
    reason : Text;
    operator : Principal;
    operatorName : Text;
    at : Common.Timestamp;
  };

  /// 机会池待办: 临近报名截止（7 天内）的公告与待确认的核对结论
  public type OpportunityTodo = {
    closingSoon : [OpportunityListItem];
    pendingConfirmations : [CheckItemView];
  };
};
