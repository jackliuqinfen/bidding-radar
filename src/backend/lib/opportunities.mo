import List "mo:core/List";
import Time "mo:core/Time";
import Common "../types/common";
import State "../types/state";
import Opportunities "../types/opportunities";
import Errors "../types/errors";
import Access "access";
import AuditLib "audit";
import NotificationsLib "notifications";
import RecordsLib "records";
import Labels "labels";

/// Opportunity pool domain logic. All business reads are update calls so denied views are audited.
module {
  let DAY_NS : Int = 86_400_000_000_000;
  let CLOSING_SOON_NS : Int = 604_800_000_000_000;

  func isBlank(t : Text) : Bool = t.size() == 0;

  func statusLabel(status : Opportunities.OpportunityStatus) : Text {
    switch (status) {
      case (#pendingReview) "待核对";
      case (#selected) "已选公司参投";
      case (#declined) "不参与";
      case (#closed) "已截止";
    };
  };

  func checkItemKindLabel(kind : Opportunities.CheckItemKind) : Text {
    switch (kind) {
      case (#qualification) "资质类别与等级";
      case (#performance) "类似业绩";
      case (#personnel) "人员与证书";
      case (#capital) "注册资本/信用";
      case (#deposit) "保证金能力";
      case (#other) "其他公告条款";
    };
  };

  func conclusionLabel(conclusion : Opportunities.CheckConclusion) : Text {
    switch (conclusion) {
      case (#conform) "符合";
      case (#nonConform) "不符合";
      case (#pending) "待核";
    };
  };

  func daysRemaining(deadline : Common.Timestamp, now : Common.Timestamp) : Nat {
    if (deadline <= now) return 0;
    let diff = deadline - now;
    let days = diff / DAY_NS;
    days.toNat();
  };

  func checkedCompanyCount(state : State.State, opportunityId : Common.OpportunityId) : Nat {
    let companies = List.empty<Common.CompanyId>();
    for (item in state.checkItems.values()) {
      if (item.opportunityId == opportunityId and not companies.contains(item.companyId)) {
        companies.add(item.companyId);
      };
    };
    companies.size();
  };

  func toView(state : State.State, opportunity : Opportunities.Opportunity) : Opportunities.OpportunityView {
    let now = Time.now();
    {
      id = opportunity.id;
      projectName = opportunity.projectName;
      tenderer = opportunity.tenderer;
      projectType = opportunity.projectType;
      projectTypeLabel = Labels.projectTypeLabel(opportunity.projectType);
      sourceName = opportunity.sourceName;
      sourceUrl = opportunity.sourceUrl;
      publishDate = opportunity.publishDate;
      registrationDeadline = opportunity.registrationDeadline;
      bidOpenTime = opportunity.bidOpenTime;
      budgetYuan = opportunity.budgetYuan;
      body = opportunity.body;
      clauses = opportunity.clauses;
      status = opportunity.status;
      statusLabel = statusLabel(opportunity.status);
      draft = opportunity.draft;
      createdBy = opportunity.createdBy;
      createdByName = Access.displayName(state, opportunity.createdBy);
      createdAt = opportunity.createdAt;
      lastModifiedBy = opportunity.lastModifiedBy;
      lastModifiedByName = Access.displayName(state, opportunity.lastModifiedBy);
      lastModifiedAt = opportunity.lastModifiedAt;
      daysRemaining = daysRemaining(opportunity.registrationDeadline, now);
      checkedCompanyCount = checkedCompanyCount(state, opportunity.id);
    };
  };

  func toListItem(state : State.State, opportunity : Opportunities.Opportunity) : Opportunities.OpportunityListItem {
    let now = Time.now();
    {
      id = opportunity.id;
      projectName = opportunity.projectName;
      tenderer = opportunity.tenderer;
      projectType = opportunity.projectType;
      projectTypeLabel = Labels.projectTypeLabel(opportunity.projectType);
      registrationDeadline = opportunity.registrationDeadline;
      daysRemaining = daysRemaining(opportunity.registrationDeadline, now);
      budgetYuan = opportunity.budgetYuan;
      status = opportunity.status;
      statusLabel = statusLabel(opportunity.status);
      checkedCompanyCount = checkedCompanyCount(state, opportunity.id);
    };
  };

  func toCheckItemView(state : State.State, caller : Principal, item : Opportunities.CheckItem) : Opportunities.CheckItemView {
    let companyName = switch (state.companies.get(item.companyId)) {
      case (?c) c.name;
      case null "";
    };
    let canView = Access.hasPermission(state, caller, item.companyId, #view);
    {
      id = item.id;
      opportunityId = item.opportunityId;
      companyId = item.companyId;
      companyName;
      kind = item.kind;
      kindLabel = checkItemKindLabel(item.kind);
      clauseExcerpt = item.clauseExcerpt;
      conclusion = item.conclusion;
      conclusionLabel = conclusionLabel(item.conclusion);
      basis = item.basis;
      evidence = if (canView) item.evidence else [];
      createdBy = item.createdBy;
      createdByName = Access.displayName(state, item.createdBy);
      createdAt = item.createdAt;
      lastModifiedBy = item.lastModifiedBy;
      lastModifiedByName = Access.displayName(state, item.lastModifiedBy);
      lastModifiedAt = item.lastModifiedAt;
      confirmation = switch (item.confirmation) {
        case (?c) ?{
          confirmer = c.confirmer;
          confirmerName = Access.displayName(state, c.confirmer);
          confirmedAt = c.confirmedAt;
        };
        case null null;
      };
    };
  };

  func toStatusChangeView(state : State.State, change : Opportunities.StatusChange) : Opportunities.StatusChangeView {
    {
      id = change.id;
      fromStatus = change.fromStatus;
      fromStatusLabel = statusLabel(change.fromStatus);
      toStatus = change.toStatus;
      toStatusLabel = statusLabel(change.toStatus);
      reason = change.reason;
      operator = change.operator;
      operatorName = Access.displayName(state, change.operator);
      at = change.at;
    };
  };

  /// Returns the first missing required field name, or null when all required fields are present.
  func missingField(input : Opportunities.OpportunityInput) : ?Text {
    if (isBlank(input.body)) return ?"公告正文";
    if (isBlank(input.sourceUrl)) return ?"公告链接";
    null;
  };

  /// Evidence must reference existing records of the same company; 符合 cannot cite a 待核/待补 record.
  func validateEvidence(state : State.State, companyId : Common.CompanyId, conclusion : Opportunities.CheckConclusion, evidence : [Opportunities.EvidenceRef]) : ?Text {
    for (ref in evidence.values()) {
      switch (state.records.get(ref.recordId)) {
        case null return ?"引用的档案不存在";
        case (?record) {
          if (record.companyId != companyId) return ?"引用的档案不属于该公司";
          if (conclusion == #conform and RecordsLib.statusOf(record) != #verified) {
            return ?"引用待核或待补档案的核对项不能保存为符合";
          };
        };
      };
    };
    null;
  };

  func addStatusChange(state : State.State, opportunityId : Common.OpportunityId, fromStatus : Opportunities.OpportunityStatus, toStatus : Opportunities.OpportunityStatus, reason : Text, operator : Principal) {
    let id = state.counters.nextStatusChangeId;
    state.counters.nextStatusChangeId := id + 1;
    state.statusChanges.add({
      id;
      opportunityId;
      fromStatus;
      toStatus;
      reason;
      operator;
      at = Time.now();
    });
  };

  /// Requires 编辑 on the company; announcement body and source URL are required. Saves as draft (creator-only).
  public func createDraft(state : State.State, caller : Principal, input : Opportunities.OpportunityInput) : Errors.ApiResult<Opportunities.OpportunityView> {
    switch (Access.requireApproved(state, caller, #createOpportunity, "录入公告", null)) {
      case (#err e) #err e;
      case (#ok _) {
        switch (missingField(input)) {
          case (?field) {
            let msg = "缺少必填项：" # field;
            AuditLib.log(state, caller, #createOpportunity, "录入公告", null, #denied, ?msg);
            return #err(#invalidInput(msg));
          };
          case null {};
        };
        let id = state.counters.nextOpportunityId;
        state.counters.nextOpportunityId := id + 1;
        let now = Time.now();
        let opportunity : Opportunities.Opportunity = {
          id;
          projectName = input.projectName;
          tenderer = input.tenderer;
          projectType = input.projectType;
          sourceName = input.sourceName;
          sourceUrl = input.sourceUrl;
          publishDate = input.publishDate;
          registrationDeadline = input.registrationDeadline;
          bidOpenTime = input.bidOpenTime;
          budgetYuan = input.budgetYuan;
          body = input.body;
          clauses = input.clauses;
          status = #pendingReview;
          draft = true;
          createdBy = caller;
          createdAt = now;
          lastModifiedBy = caller;
          lastModifiedAt = now;
        };
        state.opportunities.add(id, opportunity);
        AuditLib.log(state, caller, #createOpportunity, input.projectName, null, #success, null);
        #ok(toView(state, opportunity));
      };
    };
  };

  /// Creator only, draft only. Requires 编辑 on the company.
  public func updateDraft(state : State.State, caller : Principal, id : Common.OpportunityId, change : Opportunities.OpportunityUpdate) : Errors.ApiResult<Opportunities.OpportunityView> {
    switch (Access.requireApproved(state, caller, #createOpportunity, "修改公告草稿", null)) {
      case (#err e) #err e;
      case (#ok _) {
        switch (state.opportunities.get(id)) {
          case null {
            AuditLib.log(state, caller, #createOpportunity, "公告 #" # id.toText(), null, #denied, ?"公告不存在");
            return #err(#notFound("公告不存在"));
          };
          case (?opportunity) {
            if (not Principal.equal(opportunity.createdBy, caller)) {
              AuditLib.log(state, caller, #createOpportunity, opportunity.projectName, null, #denied, ?"只有创建人可以修改草稿");
              return #err(#permissionDenied({ companyId = 0; permission = #edit; message = "只有创建人可以修改草稿" }));
            };
            if (not opportunity.draft) {
              AuditLib.log(state, caller, #createOpportunity, opportunity.projectName, null, #denied, ?"公告已提交，不能修改草稿");
              return #err(#invalidState("公告已提交，不能修改草稿"));
            };
            switch (missingField(change)) {
              case (?field) {
                let msg = "缺少必填项：" # field;
                AuditLib.log(state, caller, #createOpportunity, opportunity.projectName, null, #denied, ?msg);
                return #err(#invalidInput(msg));
              };
              case null {};
            };
            let updated : Opportunities.Opportunity = {
              opportunity with
              projectName = change.projectName;
              tenderer = change.tenderer;
              projectType = change.projectType;
              sourceName = change.sourceName;
              sourceUrl = change.sourceUrl;
              publishDate = change.publishDate;
              registrationDeadline = change.registrationDeadline;
              bidOpenTime = change.bidOpenTime;
              budgetYuan = change.budgetYuan;
              body = change.body;
              clauses = change.clauses;
              lastModifiedBy = caller;
              lastModifiedAt = Time.now();
            };
            state.opportunities.add(id, updated);
            AuditLib.log(state, caller, #createOpportunity, updated.projectName, null, #success, null);
            #ok(toView(state, updated));
          };
        };
      };
    };
  };

  /// Creator only; moves a draft into the opportunity pool (待核对).
  public func submit(state : State.State, caller : Principal, id : Common.OpportunityId) : Errors.ApiResult<Opportunities.OpportunityView> {
    switch (Access.requireApproved(state, caller, #submitOpportunity, "提交公告", null)) {
      case (#err e) #err e;
      case (#ok _) {
        switch (state.opportunities.get(id)) {
          case null {
            AuditLib.log(state, caller, #submitOpportunity, "公告 #" # id.toText(), null, #denied, ?"公告不存在");
            return #err(#notFound("公告不存在"));
          };
          case (?opportunity) {
            if (not Principal.equal(opportunity.createdBy, caller)) {
              AuditLib.log(state, caller, #submitOpportunity, opportunity.projectName, null, #denied, ?"只有创建人可以提交公告");
              return #err(#permissionDenied({ companyId = 0; permission = #edit; message = "只有创建人可以提交公告" }));
            };
            if (not opportunity.draft) {
              AuditLib.log(state, caller, #submitOpportunity, opportunity.projectName, null, #denied, ?"公告已提交");
              return #err(#invalidState("公告已提交"));
            };
            let updated : Opportunities.Opportunity = {
              opportunity with
              draft = false;
              status = #pendingReview;
              lastModifiedBy = caller;
              lastModifiedAt = Time.now();
            };
            state.opportunities.add(id, updated);
            AuditLib.log(state, caller, #submitOpportunity, updated.projectName, null, #success, null);
            #ok(toView(state, updated));
          };
        };
      };
    };
  };

  /// Requires a reason; records a status change entry. 已选公司参投 requires at least one 符合 check item.
  public func changeStatus(state : State.State, caller : Principal, id : Common.OpportunityId, toStatus : Opportunities.OpportunityStatus, reason : Text) : Errors.ApiResult<Opportunities.OpportunityView> {
    switch (Access.requireApproved(state, caller, #changeOpportunityStatus, "变更公告状态", null)) {
      case (#err e) #err e;
      case (#ok _) {
        switch (state.opportunities.get(id)) {
          case null {
            AuditLib.log(state, caller, #changeOpportunityStatus, "公告 #" # id.toText(), null, #denied, ?"公告不存在");
            return #err(#notFound("公告不存在"));
          };
          case (?opportunity) {
            if (opportunity.draft) {
              AuditLib.log(state, caller, #changeOpportunityStatus, opportunity.projectName, null, #denied, ?"草稿不能变更状态，请先提交");
              return #err(#invalidState("草稿不能变更状态，请先提交"));
            };
            if (isBlank(reason)) {
              AuditLib.log(state, caller, #changeOpportunityStatus, opportunity.projectName, null, #denied, ?"状态变更必须填写原因");
              return #err(#invalidInput("状态变更必须填写原因"));
            };
            if (toStatus == #selected) {
              let hasConform = state.checkItems.values().any(func (item : Opportunities.CheckItem) : Bool {
                item.opportunityId == id and item.conclusion == #conform;
              });
              if (not hasConform) {
                let msg = "置为已选公司参投前，至少需要一条符合的资格核对结论";
                AuditLib.log(state, caller, #changeOpportunityStatus, opportunity.projectName, null, #denied, ?msg);
                return #err(#invalidState(msg));
              };
            };
            let updated : Opportunities.Opportunity = {
              opportunity with
              status = toStatus;
              lastModifiedBy = caller;
              lastModifiedAt = Time.now();
            };
            state.opportunities.add(id, updated);
            addStatusChange(state, id, opportunity.status, toStatus, reason, caller);
            AuditLib.log(state, caller, #changeOpportunityStatus, updated.projectName, null, #success, null);
            #ok(toView(state, updated));
          };
        };
      };
    };
  };

  /// Approved members; drafts visible only to their creator.
  public func get(state : State.State, caller : Principal, id : Common.OpportunityId) : Errors.ApiResult<Opportunities.OpportunityView> {
    switch (Access.requireApproved(state, caller, #viewList, "查看公告", null)) {
      case (#err e) #err e;
      case (#ok _) {
        switch (state.opportunities.get(id)) {
          case null {
            AuditLib.log(state, caller, #viewList, "公告 #" # id.toText(), null, #denied, ?"公告不存在");
            return #err(#notFound("公告不存在"));
          };
          case (?opportunity) {
            if (opportunity.draft and not Principal.equal(opportunity.createdBy, caller)) {
              AuditLib.log(state, caller, #viewList, opportunity.projectName, null, #denied, ?"草稿仅创建人可见");
              return #err(#notFound("公告不存在"));
            };
            AuditLib.log(state, caller, #viewList, opportunity.projectName, null, #success, null);
            #ok(toView(state, opportunity));
          };
        };
      };
    };
  };

  func matchesFilter(opportunity : Opportunities.Opportunity, filter : Opportunities.OpportunityFilter) : Bool {
    let okType = switch (filter.projectType) {
      case (?t) opportunity.projectType == t;
      case null true;
    };
    let okStatus = switch (filter.status) {
      case (?s) opportunity.status == s;
      case null true;
    };
    let okFrom = switch (filter.deadlineFrom) {
      case (?from) opportunity.registrationDeadline >= from;
      case null true;
    };
    let okTo = switch (filter.deadlineTo) {
      case (?to) opportunity.registrationDeadline <= to;
      case null true;
    };
    let okSearch = switch (filter.search) {
      case (?q) {
        if (isBlank(q)) true else {
          let needle = q.toLower();
          let hay = (opportunity.projectName # " " # opportunity.tenderer).toLower();
          hay.contains(#text needle);
        };
      };
      case null true;
    };
    okType and okStatus and okFrom and okTo and okSearch;
  };

  /// Approved members; drafts excluded except the caller's own. Filtered and sorted.
  public func list(state : State.State, caller : Principal, filter : Opportunities.OpportunityFilter) : Errors.ApiResult<[Opportunities.OpportunityListItem]> {
    switch (Access.requireApproved(state, caller, #viewList, "机会池列表", null)) {
      case (#err e) #err e;
      case (#ok _) {
        let all = state.opportunities.values().toArray();
        let visible = all.filter(func (o : Opportunities.Opportunity) : Bool {
          (not o.draft or Principal.equal(o.createdBy, caller)) and matchesFilter(o, filter);
        });
        let sortBy = filter.sortBy ?? #deadline;
        let descending = filter.descending;
        let sorted = visible.sort(func (a : Opportunities.Opportunity, b : Opportunities.Opportunity) : { #less; #equal; #greater } {
          let primary = switch (sortBy) {
            case (#deadline) {
              if (a.registrationDeadline < b.registrationDeadline) #less
              else if (a.registrationDeadline > b.registrationDeadline) #greater
              else #equal;
            };
            case (#createdAt) {
              if (a.createdAt < b.createdAt) #less
              else if (a.createdAt > b.createdAt) #greater
              else #equal;
            };
          };
          let ordered = if (descending) {
            switch (primary) {
              case (#less) #greater;
              case (#greater) #less;
              case (#equal) #equal;
            };
          } else {
            primary;
          };
          switch (ordered) {
            case (#equal) {
              if (a.id > b.id) #less else if (a.id < b.id) #greater else #equal;
            };
            case _ ordered;
          };
        });
        AuditLib.log(state, caller, #viewList, "机会池列表", null, #success, null);
        #ok(sorted.map(func (o : Opportunities.Opportunity) : Opportunities.OpportunityListItem = toListItem(state, o)));
      };
    };
  };

  /// Status change history for an announcement.
  public func statusHistory(state : State.State, caller : Principal, id : Common.OpportunityId) : Errors.ApiResult<[Opportunities.StatusChangeView]> {
    switch (Access.requireApproved(state, caller, #viewList, "公告状态变更记录", null)) {
      case (#err e) #err e;
      case (#ok _) {
        switch (state.opportunities.get(id)) {
          case null {
            AuditLib.log(state, caller, #viewList, "公告 #" # id.toText(), null, #denied, ?"公告不存在");
            return #err(#notFound("公告不存在"));
          };
          case (?opportunity) {
            if (opportunity.draft and not Principal.equal(opportunity.createdBy, caller)) {
              AuditLib.log(state, caller, #viewList, opportunity.projectName, null, #denied, ?"草稿仅创建人可见");
              return #err(#notFound("公告不存在"));
            };
            let entries = state.statusChanges.toArray().filter(func (c : Opportunities.StatusChange) : Bool {
              c.opportunityId == id;
            });
            let sorted = entries.sort(func (a : Opportunities.StatusChange, b : Opportunities.StatusChange) : { #less; #equal; #greater } {
              if (a.id < b.id) #less else if (a.id > b.id) #greater else #equal;
            });
            AuditLib.log(state, caller, #viewList, opportunity.projectName, null, #success, null);
            #ok(sorted.map(func (c : Opportunities.StatusChange) : Opportunities.StatusChangeView = toStatusChangeView(state, c)));
          };
        };
      };
    };
  };

  /// Requires 编辑 on the company. Conclusion 符合 is rejected when citing a 待核/待补 record.
  public func createCheckItem(state : State.State, caller : Principal, input : Opportunities.CheckItemInput) : Errors.ApiResult<Opportunities.CheckItemView> {
    switch (Access.requirePermission(state, caller, input.companyId, #edit, #createCheckItem, "新建核对结论")) {
      case (#err e) #err e;
      case (#ok _) {
        switch (state.opportunities.get(input.opportunityId)) {
          case null {
            AuditLib.log(state, caller, #createCheckItem, "公告 #" # input.opportunityId.toText(), ?input.companyId, #denied, ?"公告不存在");
            return #err(#notFound("公告不存在"));
          };
          case (?_) {};
        };
        if (isBlank(input.basis)) {
          AuditLib.log(state, caller, #createCheckItem, "新建核对结论", ?input.companyId, #denied, ?"依据说明必填");
          return #err(#invalidInput("依据说明必填"));
        };
        switch (validateEvidence(state, input.companyId, input.conclusion, input.evidence)) {
          case (?msg) {
            AuditLib.log(state, caller, #createCheckItem, "新建核对结论", ?input.companyId, #denied, ?msg);
            return #err(#invalidInput(msg));
          };
          case null {};
        };
        let id = state.counters.nextCheckItemId;
        state.counters.nextCheckItemId := id + 1;
        let now = Time.now();
        let item : Opportunities.CheckItem = {
          id;
          opportunityId = input.opportunityId;
          companyId = input.companyId;
          kind = input.kind;
          clauseExcerpt = input.clauseExcerpt;
          conclusion = input.conclusion;
          basis = input.basis;
          evidence = input.evidence;
          createdBy = caller;
          createdAt = now;
          lastModifiedBy = caller;
          lastModifiedAt = now;
          confirmation = null;
        };
        state.checkItems.add(id, item);
        AuditLib.log(state, caller, #createCheckItem, "核对项 #" # id.toText(), ?input.companyId, #success, null);
        #ok(toCheckItemView(state, caller, item));
      };
    };
  };

  /// Requires 编辑 on the company; confirmed items are immutable.
  public func updateCheckItem(state : State.State, caller : Principal, id : Common.CheckItemId, change : Opportunities.CheckItemUpdate) : Errors.ApiResult<Opportunities.CheckItemView> {
    switch (state.checkItems.get(id)) {
      case null {
        switch (Access.requireApproved(state, caller, #editCheckItem, "修改核对结论", null)) {
          case (#err e) #err e;
          case (#ok _) {
            AuditLib.log(state, caller, #editCheckItem, "核对项 #" # id.toText(), null, #denied, ?"核对项不存在");
            #err(#notFound("核对项不存在"));
          };
        };
      };
      case (?item) {
        switch (Access.requirePermission(state, caller, item.companyId, #edit, #editCheckItem, "修改核对结论")) {
          case (#err e) #err e;
          case (#ok _) {
            if (item.confirmation != null) {
              AuditLib.log(state, caller, #editCheckItem, "核对项 #" # id.toText(), ?item.companyId, #denied, ?"已确认的核对项不可修改");
              return #err(#invalidState("已确认的核对项不可修改"));
            };
            if (isBlank(change.basis)) {
              AuditLib.log(state, caller, #editCheckItem, "核对项 #" # id.toText(), ?item.companyId, #denied, ?"依据说明必填");
              return #err(#invalidInput("依据说明必填"));
            };
            switch (validateEvidence(state, item.companyId, change.conclusion, change.evidence)) {
              case (?msg) {
                AuditLib.log(state, caller, #editCheckItem, "核对项 #" # id.toText(), ?item.companyId, #denied, ?msg);
                return #err(#invalidInput(msg));
              };
              case null {};
            };
            let updated : Opportunities.CheckItem = {
              item with
              kind = change.kind;
              clauseExcerpt = change.clauseExcerpt;
              conclusion = change.conclusion;
              basis = change.basis;
              evidence = change.evidence;
              lastModifiedBy = caller;
              lastModifiedAt = Time.now();
            };
            state.checkItems.add(id, updated);
            AuditLib.log(state, caller, #editCheckItem, "核对项 #" # id.toText(), ?item.companyId, #success, null);
            #ok(toCheckItemView(state, caller, updated));
          };
        };
      };
    };
  };

  /// Requires 核实 on the company; creator cannot confirm their own item. Notifies the announcement recorder.
  public func confirmCheckItem(state : State.State, caller : Principal, id : Common.CheckItemId) : Errors.ApiResult<Opportunities.CheckItemView> {
    switch (state.checkItems.get(id)) {
      case null {
        switch (Access.requireApproved(state, caller, #confirmCheckItem, "确认核对结论", null)) {
          case (#err e) #err e;
          case (#ok _) {
            AuditLib.log(state, caller, #confirmCheckItem, "核对项 #" # id.toText(), null, #denied, ?"核对项不存在");
            #err(#notFound("核对项不存在"));
          };
        };
      };
      case (?item) {
        switch (Access.requirePermission(state, caller, item.companyId, #verify, #confirmCheckItem, "确认核对结论")) {
          case (#err e) #err e;
          case (#ok _) {
            if (item.confirmation != null) {
              AuditLib.log(state, caller, #confirmCheckItem, "核对项 #" # id.toText(), ?item.companyId, #denied, ?"核对项已确认");
              return #err(#invalidState("核对项已确认"));
            };
            if (Principal.equal(caller, item.createdBy)) {
              let msg = "创建人不能确认自己提交的核对结论";
              AuditLib.log(state, caller, #confirmCheckItem, "核对项 #" # id.toText(), ?item.companyId, #denied, ?msg);
              return #err(#selfVerificationDenied(msg));
            };
            let now = Time.now();
            let updated : Opportunities.CheckItem = {
              item with
              confirmation = ?{ confirmer = caller; confirmedAt = now };
            };
            state.checkItems.add(id, updated);
            AuditLib.log(state, caller, #confirmCheckItem, "核对项 #" # id.toText(), ?item.companyId, #success, null);
            switch (state.opportunities.get(item.opportunityId)) {
              case (?opportunity) {
                NotificationsLib.notify(
                  state,
                  opportunity.createdBy,
                  #checkItemConfirmed,
                  "公告【" # opportunity.projectName # "】的核对结论 #" # id.toText() # " 已确认。",
                  ?item.companyId,
                  null,
                  ?item.opportunityId,
                  null,
                );
              };
              case null {};
            };
            #ok(toCheckItemView(state, caller, updated));
          };
        };
      };
    };
  };

  /// Check items for an announcement; company evidence returned only with 查看 on that company.
  public func listCheckItems(state : State.State, caller : Principal, opportunityId : Common.OpportunityId) : Errors.ApiResult<[Opportunities.CheckItemView]> {
    switch (Access.requireApproved(state, caller, #viewList, "核对结论列表", null)) {
      case (#err e) #err e;
      case (#ok _) {
        switch (state.opportunities.get(opportunityId)) {
          case null {
            AuditLib.log(state, caller, #viewList, "公告 #" # opportunityId.toText(), null, #denied, ?"公告不存在");
            return #err(#notFound("公告不存在"));
          };
          case (?opportunity) {
            if (opportunity.draft and not Principal.equal(opportunity.createdBy, caller)) {
              AuditLib.log(state, caller, #viewList, opportunity.projectName, null, #denied, ?"草稿仅创建人可见");
              return #err(#notFound("公告不存在"));
            };
            let items = state.checkItems.values().toArray().filter(func (item : Opportunities.CheckItem) : Bool {
              item.opportunityId == opportunityId;
            });
            let sorted = items.sort(func (a : Opportunities.CheckItem, b : Opportunities.CheckItem) : { #less; #equal; #greater } {
              if (a.id < b.id) #less else if (a.id > b.id) #greater else #equal;
            });
            AuditLib.log(state, caller, #viewList, opportunity.projectName, null, #success, null);
            #ok(sorted.map(func (item : Opportunities.CheckItem) : Opportunities.CheckItemView = toCheckItemView(state, caller, item)));
          };
        };
      };
    };
  };

  /// 机会池待办: announcements closing within 7 days and unconfirmed check items.
  public func todo(state : State.State, caller : Principal) : Errors.ApiResult<Opportunities.OpportunityTodo> {
    switch (Access.requireApproved(state, caller, #viewList, "机会池待办", null)) {
      case (#err e) #err e;
      case (#ok _) {
        let now = Time.now();
        let closingSoon = state.opportunities.values().toArray().filter(func (o : Opportunities.Opportunity) : Bool {
          (not o.draft or Principal.equal(o.createdBy, caller))
          and o.status != #closed
          and o.registrationDeadline > now
          and o.registrationDeadline - now <= CLOSING_SOON_NS;
        });
        let sortedClosing = closingSoon.sort(func (a : Opportunities.Opportunity, b : Opportunities.Opportunity) : { #less; #equal; #greater } {
          if (a.registrationDeadline < b.registrationDeadline) #less
          else if (a.registrationDeadline > b.registrationDeadline) #greater
          else #equal;
        });
        let pending = state.checkItems.values().toArray().filter(func (item : Opportunities.CheckItem) : Bool {
          item.confirmation == null;
        });
        let sortedPending = pending.sort(func (a : Opportunities.CheckItem, b : Opportunities.CheckItem) : { #less; #equal; #greater } {
          if (a.id > b.id) #less else if (a.id < b.id) #greater else #equal;
        });
        AuditLib.log(state, caller, #viewList, "机会池待办", null, #success, null);
        #ok({
          closingSoon = sortedClosing.map(func (o : Opportunities.Opportunity) : Opportunities.OpportunityListItem = toListItem(state, o));
          pendingConfirmations = sortedPending.map(func (item : Opportunities.CheckItem) : Opportunities.CheckItemView = toCheckItemView(state, caller, item));
        });
      };
    };
  };
};
