import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Common "../types/common";
import State "../types/state";
import Records "../types/records";
import Attachments "../types/attachments";
import Audit "../types/audit";
import Errors "../types/errors";
import Access "access";
import AuditLib "audit";
import NotificationsLib "notifications";
import Labels "labels";

module {
  let NEAR_EXPIRY_NS : Int = 2_592_000_000_000_000;

  func isBlank(t : Text) : Bool = t.size() == 0;

  /// Attachment metadata for a record, computed for the caller; never carries the blob.
  func attachmentsForRecord(state : State.State, caller : Principal, recordId : Common.RecordId) : [Attachments.AttachmentView] {
    let mine = state.attachments.values().toArray().filter(func (a : Attachments.Attachment) : Bool { a.recordId == recordId });
    let sorted = mine.sort(func (a : Attachments.Attachment, b : Attachments.Attachment) : { #less; #equal; #greater } {
      if (a.id < b.id) #less else if (a.id > b.id) #greater else #equal;
    });
    sorted.map(func (a : Attachments.Attachment) : Attachments.AttachmentView {
      let n = a.versions.size();
      let current = if (n == 0) null else ?a.versions[n - 1];
      let canDownload = if (a.sensitive) {
        Access.hasPermission(state, caller, a.companyId, #sensitiveDownload);
      } else {
        Access.hasPermission(state, caller, a.companyId, #view);
      };
      {
        id = a.id;
        recordId = a.recordId;
        companyId = a.companyId;
        sensitive = a.sensitive;
        currentVersion = switch (current) { case (?v) v.version; case null 0 };
        fileName = switch (current) { case (?v) v.fileName; case null "" };
        versions = a.versions.map(func (v : Attachments.AttachmentVersion) : Attachments.AttachmentVersionMeta {
          {
            version = v.version;
            uploader = v.uploader;
            uploaderName = Access.displayName(state, v.uploader);
            uploadedAt = v.uploadedAt;
            fileName = v.fileName;
            note = v.note;
            isSample = v.isSample;
          };
        });
        canDownload;
      };
    });
  };

  /// 待补 when key information is missing/unknown, else 已核实 when verified, else 待核.
  public func statusOf(record : Records.ArchiveRecord) : Records.RecordStatus {
    if (isIncomplete(record.data)) return #missing;
    switch (record.verification) {
      case (?_) #verified;
      case null #pendingReview;
    };
  };

  func isIncomplete(data : Records.RecordData) : Bool {
    switch (data) {
      case (#license(d)) {
        isBlank(d.category) or isBlank(d.name) or isBlank(d.number) or isBlank(d.issuingAuthority);
      };
      case (#companyTrack(d)) {
        isBlank(d.projectName) or isBlank(d.owner) or d.projectType == null or d.contractAmountFen == null or d.completionDate == null;
      };
      case (#person(d)) {
        isBlank(d.name) or isBlank(d.idNumber) or isBlank(d.phone) or isBlank(d.position);
      };
      case (#personCert(d)) {
        d.personId == 0 or isBlank(d.category) or isBlank(d.number) or isBlank(d.issuingAuthority);
      };
      case (#personTrack(d)) {
        d.personId == 0 or isBlank(d.projectName) or isBlank(d.role) or d.completionDate == null;
      };
    };
  };

  func validToOf(data : Records.RecordData) : ?Common.Timestamp {
    switch (data) {
      case (#license(d)) d.validTo;
      case (#personCert(d)) d.validTo;
      case _ null;
    };
  };

  /// null when validity is unknown or not applicable; never judges unknown data as expired.
  public func expiryOf(record : Records.ArchiveRecord, now : Common.Timestamp) : ?Records.ExpiryFlag {
    switch (validToOf(record.data)) {
      case (?to) {
        if (to <= now) ?#expired
        else if (to - now <= NEAR_EXPIRY_NS) ?#nearExpiry
        else null;
      };
      case null null;
    };
  };

  public func kindOf(data : Records.RecordData) : Records.RecordKind {
    switch (data) {
      case (#license(_)) #license;
      case (#companyTrack(_)) #companyTrack;
      case (#person(_)) #person;
      case (#personCert(_)) #personCert;
      case (#personTrack(_)) #personTrack;
    };
  };

  /// e.g. 110101********1234
  public func maskIdNumber(idNumber : Text) : Text {
    let chars = idNumber.toArray();
    let n = chars.size();
    if (n <= 8) {
      return "********";
    };
    let head = chars.sliceToArray(0, 6);
    let tail = chars.sliceToArray(n - 4 : Nat, n);
    let stars = Array.tabulate(n - 10 : Nat, func (_ : Nat) : Char = '*');
    Text.fromArray(head.concat(stars).concat(tail));
  };

  func maskData(data : Records.RecordData) : Records.RecordData {
    switch (data) {
      case (#person(d)) #person({ d with idNumber = maskIdNumber(d.idNumber) });
      case _ data;
    };
  };

  func titleOf(data : Records.RecordData) : Text {
    switch (data) {
      case (#license(d)) d.name;
      case (#companyTrack(d)) d.projectName;
      case (#person(d)) d.name;
      case (#personCert(d)) d.category;
      case (#personTrack(d)) d.projectName;
    };
  };

  /// Full view with the ID number masked and attachments filtered to metadata; does not check permissions.
  public func toView(state : State.State, caller : Principal, record : Records.ArchiveRecord) : Records.RecordView {
    let now = Time.now();
    let status = statusOf(record);
    let flag = expiryOf(record, now);
    let kind = kindOf(record.data);
    {
      id = record.id;
      kind;
      kindLabel = Labels.kindLabel(kind);
      companyId = record.companyId;
      companyName = switch (state.companies.get(record.companyId)) {
        case (?c) c.name;
        case null "";
      };
      data = maskData(record.data);
      title = titleOf(record.data);
      maintainer = record.maintainer;
      maintainerName = Access.displayName(state, record.maintainer);
      remarks = record.remarks;
      version = record.version;
      status;
      statusLabel = Labels.statusLabel(status);
      expiryFlag = flag;
      expiryLabel = switch (flag) {
        case (?f) ?Labels.expiryLabel(f);
        case null null;
      };
      verification = switch (record.verification) {
        case (?v) ?{
          verifier = v.verifier;
          verifierName = Access.displayName(state, v.verifier);
          verifiedAt = v.verifiedAt;
        };
        case null null;
      };
      createdBy = record.createdBy;
      createdByName = Access.displayName(state, record.createdBy);
      createdAt = record.createdAt;
      lastModifiedBy = record.lastModifiedBy;
      lastModifiedByName = Access.displayName(state, record.lastModifiedBy);
      lastModifiedAt = record.lastModifiedAt;
      attachments = attachmentsForRecord(state, caller, record.id);
    };
  };

  func addHistory(state : State.State, caller : Principal, record : Records.ArchiveRecord, action : Records.ChangeAction, changes : [Records.FieldChange]) {
    let id = state.counters.nextHistoryId;
    state.counters.nextHistoryId := id + 1;
    state.history.add({
      id;
      recordId = record.id;
      companyId = record.companyId;
      editor = caller;
      at = Time.now();
      resultingVersion = record.version;
      action;
      changes;
    });
  };

  func textOfOptInt(v : ?Common.Timestamp) : Text {
    switch (v) {
      case (?x) x.toText();
      case null "";
    };
  };

  func textOfOptNat(v : ?Nat) : Text {
    switch (v) {
      case (?x) x.toText();
      case null "";
    };
  };

  func textOfOptProjectType(v : ?Records.ProjectType) : Text {
    switch (v) {
      case (?p) Labels.projectTypeLabel(p);
      case null "";
    };
  };

  /// Field-by-field diff of two record payloads; ID numbers are masked.
  func diffData(before : Records.RecordData, after : Records.RecordData) : [Records.FieldChange] {
    let out = List.empty<Records.FieldChange>();
    func push(field : Text, b : Text, a : Text) {
      if (b != a) {
        out.add({ field; before = b; after = a });
      };
    };
    switch (before, after) {
      case (#license(b), #license(a)) {
        push("类别", b.category, a.category);
        push("名称", b.name, a.name);
        push("编号", b.number, a.number);
        push("发证机关", b.issuingAuthority, a.issuingAuthority);
        push("有效期起", textOfOptInt(b.validFrom), textOfOptInt(a.validFrom));
        push("有效期止", textOfOptInt(b.validTo), textOfOptInt(a.validTo));
      };
      case (#companyTrack(b), #companyTrack(a)) {
        push("项目名称", b.projectName, a.projectName);
        push("业主", b.owner, a.owner);
        push("项目类型", textOfOptProjectType(b.projectType), textOfOptProjectType(a.projectType));
        push("合同金额(分)", textOfOptNat(b.contractAmountFen), textOfOptNat(a.contractAmountFen));
        push("竣工日期", textOfOptInt(b.completionDate), textOfOptInt(a.completionDate));
      };
      case (#person(b), #person(a)) {
        push("姓名", b.name, a.name);
        push("身份证号", maskIdNumber(b.idNumber), maskIdNumber(a.idNumber));
        push("电话", b.phone, a.phone);
        push("职务", b.position, a.position);
      };
      case (#personCert(b), #personCert(a)) {
        push("人员", b.personId.toText(), a.personId.toText());
        push("类别", b.category, a.category);
        push("编号", b.number, a.number);
        push("发证机关", b.issuingAuthority, a.issuingAuthority);
        push("有效期起", textOfOptInt(b.validFrom), textOfOptInt(a.validFrom));
        push("有效期止", textOfOptInt(b.validTo), textOfOptInt(a.validTo));
      };
      case (#personTrack(b), #personTrack(a)) {
        push("人员", b.personId.toText(), a.personId.toText());
        push("项目名称", b.projectName, a.projectName);
        push("角色", b.role, a.role);
        push("完成日期", textOfOptInt(b.completionDate), textOfOptInt(a.completionDate));
      };
      case _ {};
    };
    out.toArray();
  };

  /// True when the two payloads differ in any field other than the person ID number.
  func substantialChange(before : Records.RecordData, after : Records.RecordData) : Bool {
    let changes = diffData(before, after);
    changes.any(func (c : Records.FieldChange) : Bool { c.field != "身份证号" });
  };

  /// Person certificate/track must reference a person of the same company.
  func personRefValid(state : State.State, companyId : Common.CompanyId, data : Records.RecordData) : Bool {
    let personId = switch (data) {
      case (#personCert(d)) ?d.personId;
      case (#personTrack(d)) ?d.personId;
      case _ null;
    };
    switch (personId) {
      case (?pid) {
        if (pid == 0) return false;
        switch (state.records.get(pid)) {
          case (?p) {
            p.companyId == companyId and (switch (p.data) { case (#person(_)) true; case _ false });
          };
          case null false;
        };
      };
      case null true;
    };
  };

  /// Keeps the stored ID number when the incoming value is omitted, unchanged or the masked placeholder.
  func mergeIdNumber(stored : Text, incoming : Text) : Text {
    if (isBlank(incoming)) return stored;
    if (incoming.contains(#text "*")) return stored;
    if (incoming == stored) return stored;
    incoming;
  };

  func mergeData(stored : Records.RecordData, incoming : Records.RecordData) : Records.RecordData {
    switch (stored, incoming) {
      case (#person(s), #person(i)) #person({ i with idNumber = mergeIdNumber(s.idNumber, i.idNumber) });
      case _ incoming;
    };
  };

  /// Requires 编辑 on the company. Person certificate/track must reference a person of the same company. Status starts 待补 or 待核. Writes history + audit.
  public func create(state : State.State, caller : Principal, input : Records.RecordInput) : Errors.ApiResult<Records.RecordView> {
    switch (Access.requirePermission(state, caller, input.companyId, #edit, #createRecord, "新建记录")) {
      case (#err e) #err e;
      case (#ok _) {
        switch (state.companies.get(input.companyId)) {
          case null {
            AuditLib.log(state, caller, #createRecord, "公司 #" # input.companyId.toText(), ?input.companyId, #denied, ?"公司不存在");
            return #err(#notFound("公司不存在"));
          };
          case (?_) {};
        };
        if (not Access.isApproved(state, input.maintainer)) {
          AuditLib.log(state, caller, #createRecord, "新建记录", ?input.companyId, #denied, ?"维护责任人必须是已批准用户");
          return #err(#invalidInput("维护责任人必须是已批准用户"));
        };
        if (not personRefValid(state, input.companyId, input.data)) {
          AuditLib.log(state, caller, #createRecord, "新建记录", ?input.companyId, #denied, ?"关联人员不存在或不属于该公司");
          return #err(#invalidInput("关联人员不存在或不属于该公司"));
        };
        let id = state.counters.nextRecordId;
        state.counters.nextRecordId := id + 1;
        let now = Time.now();
        let record : Records.ArchiveRecord = {
          id;
          companyId = input.companyId;
          data = input.data;
          maintainer = input.maintainer;
          remarks = input.remarks;
          version = 1;
          verification = null;
          createdBy = caller;
          createdAt = now;
          lastModifiedBy = caller;
          lastModifiedAt = now;
        };
        state.records.add(id, record);
        addHistory(state, caller, record, #create, []);
        AuditLib.log(state, caller, #createRecord, titleOf(record.data), ?record.companyId, #success, null);
        #ok(toView(state, caller, record));
      };
    };
  };

  /// Requires 编辑. Stale expectedVersion => #conflict with latest record, nothing overwritten (audited as denied).
  /// Substantial changes reset to 待核, clear verifier, notify 维护责任人; remarks-only keeps verification.
  /// Person idNumber unchanged or containing the mask placeholder keeps the stored value.
  public func update(state : State.State, caller : Principal, id : Common.RecordId, expectedVersion : Nat, change : Records.RecordUpdate) : Errors.ApiResult<Records.RecordView> {
    switch (state.records.get(id)) {
      case null {
        switch (Access.requireApproved(state, caller, #editRecord, "编辑记录", null)) {
          case (#err e) #err e;
          case (#ok _) {
            AuditLib.log(state, caller, #editRecord, "记录 #" # id.toText(), null, #denied, ?"记录不存在");
            #err(#notFound("记录不存在"));
          };
        };
      };
      case (?record) {
        switch (Access.requirePermission(state, caller, record.companyId, #edit, #editRecord, "编辑记录")) {
          case (#err e) #err e;
          case (#ok _) {
            if (expectedVersion != record.version) {
              AuditLib.log(state, caller, #editRecord, titleOf(record.data), ?record.companyId, #denied, ?"版本冲突");
              return #err(#conflict({ latest = toView(state, caller, record) }));
            };
            if (not Access.isApproved(state, change.maintainer)) {
              AuditLib.log(state, caller, #editRecord, titleOf(record.data), ?record.companyId, #denied, ?"维护责任人必须是已批准用户");
              return #err(#invalidInput("维护责任人必须是已批准用户"));
            };
            let merged = mergeData(record.data, change.data);
            if (not personRefValid(state, record.companyId, merged)) {
              AuditLib.log(state, caller, #editRecord, titleOf(record.data), ?record.companyId, #denied, ?"关联人员不存在或不属于该公司");
              return #err(#invalidInput("关联人员不存在或不属于该公司"));
            };
            let changes = diffData(record.data, merged);
            let substantial = substantialChange(record.data, merged);
            let now = Time.now();
            let newVersion = record.version + 1;
            let updated : Records.ArchiveRecord = {
              record with
              data = merged;
              maintainer = change.maintainer;
              remarks = change.remarks;
              version = newVersion;
              verification = if (substantial) null else record.verification;
              lastModifiedBy = caller;
              lastModifiedAt = now;
            };
            state.records.add(id, updated);
            addHistory(state, caller, updated, if (substantial) #resetToPending else #update, changes);
            AuditLib.log(state, caller, #editRecord, titleOf(updated.data), ?updated.companyId, #success, null);
            if (substantial) {
              let companyName = switch (state.companies.get(updated.companyId)) {
                case (?c) c.name;
                case null "";
              };
              NotificationsLib.notify(
                state,
                updated.maintainer,
                #resetToPending,
                "【" # companyName # "】记录 #" # updated.id.toText() # " 内容已变更，已重置为待核，请重新核实。",
                ?updated.companyId,
                ?updated.id,
                null,
                null,
              );
            };
            #ok(toView(state, caller, updated));
          };
        };
      };
    };
  };

  /// Requires 查看; denial audited.
  public func get(state : State.State, caller : Principal, id : Common.RecordId) : Errors.ApiResult<Records.RecordView> {
    switch (state.records.get(id)) {
      case null {
        switch (Access.requireApproved(state, caller, #viewRecord, "查看记录", null)) {
          case (#err e) #err e;
          case (#ok _) {
            AuditLib.log(state, caller, #viewRecord, "记录 #" # id.toText(), null, #denied, ?"记录不存在");
            #err(#notFound("记录不存在"));
          };
        };
      };
      case (?record) {
        switch (Access.requirePermission(state, caller, record.companyId, #view, #viewRecord, "查看记录")) {
          case (#err e) #err e;
          case (#ok _) {
            AuditLib.log(state, caller, #viewRecord, titleOf(record.data), ?record.companyId, #success, null);
            #ok(toView(state, caller, record));
          };
        };
      };
    };
  };

  func matchesFilter(_state : State.State, record : Records.ArchiveRecord, filter : Records.RecordFilter, now : Common.Timestamp) : Bool {
    let okCompany = switch (filter.companyId) {
      case (?c) record.companyId == c;
      case null true;
    };
    let okKind = switch (filter.kind) {
      case (?k) kindOf(record.data) == k;
      case null true;
    };
    let okStatus = switch (filter.status) {
      case (?s) statusOf(record) == s;
      case null true;
    };
    let okExpiry = switch (filter.expiry) {
      case (?e) expiryOf(record, now) == ?e;
      case null true;
    };
    let okCategory = switch (filter.category) {
      case (?cat) {
        let recordCategory = switch (record.data) {
          case (#license(d)) d.category;
          case (#personCert(d)) d.category;
          case _ "";
        };
        recordCategory == cat;
      };
      case null true;
    };
    let okMaintainer = switch (filter.maintainer) {
      case (?m) Principal.equal(record.maintainer, m);
      case null true;
    };
    let okPerson = switch (filter.personId) {
      case (?pid) {
        let ref = switch (record.data) {
          case (#personCert(d)) ?d.personId;
          case (#personTrack(d)) ?d.personId;
          case _ null;
        };
        ref == ?pid;
      };
      case null true;
    };
    let okSearch = switch (filter.search) {
      case (?q) {
        if (isBlank(q)) true else {
          let needle = q.toLower();
          let hay = (titleOf(record.data) # " " # record.remarks).toLower();
          hay.contains(#text needle);
        };
      };
      case null true;
    };
    okCompany and okKind and okStatus and okExpiry and okCategory and okMaintainer and okPerson and okSearch;
  };

  /// Only records on companies with 查看; a filter on a company without 查看 is a denied (audited) request.
  public func list(state : State.State, caller : Principal, filter : Records.RecordFilter) : Errors.ApiResult<[Records.RecordView]> {
    switch (filter.companyId) {
      case (?companyId) {
        switch (Access.requirePermission(state, caller, companyId, #view, #viewList, "记录列表")) {
          case (#err e) return #err e;
          case (#ok _) {};
        };
      };
      case null {
        switch (Access.requireApproved(state, caller, #viewList, "记录列表", null)) {
          case (#err e) return #err e;
          case (#ok _) {};
        };
      };
    };
    let now = Time.now();
    let all = state.records.values().toArray();
    let visible = all.filter(func (r : Records.ArchiveRecord) : Bool {
      Access.hasPermission(state, caller, r.companyId, #view) and matchesFilter(state, r, filter, now);
    });
    let sorted = visible.sort(func (a : Records.ArchiveRecord, b : Records.ArchiveRecord) : { #less; #equal; #greater } {
      if (a.id > b.id) #less else if (a.id < b.id) #greater else #equal;
    });
    #ok(sorted.map(func (r : Records.ArchiveRecord) : Records.RecordView = toView(state, caller, r)));
  };

  /// Requires 核实; record must be 待核; denied (audited) if caller created or last modified the current version.
  public func verify(state : State.State, caller : Principal, id : Common.RecordId, expectedVersion : Nat) : Errors.ApiResult<Records.RecordView> {
    switch (state.records.get(id)) {
      case null {
        switch (Access.requireApproved(state, caller, #verifyRecord, "核实记录", null)) {
          case (#err e) #err e;
          case (#ok _) {
            AuditLib.log(state, caller, #verifyRecord, "记录 #" # id.toText(), null, #denied, ?"记录不存在");
            #err(#notFound("记录不存在"));
          };
        };
      };
      case (?record) {
        switch (Access.requirePermission(state, caller, record.companyId, #verify, #verifyRecord, "核实记录")) {
          case (#err e) #err e;
          case (#ok _) {
            if (expectedVersion != record.version) {
              AuditLib.log(state, caller, #verifyRecord, titleOf(record.data), ?record.companyId, #denied, ?"版本冲突");
              return #err(#conflict({ latest = toView(state, caller, record) }));
            };
            if (statusOf(record) != #pendingReview) {
              let msg = "只有待核记录可以核实";
              AuditLib.log(state, caller, #verifyRecord, titleOf(record.data), ?record.companyId, #denied, ?msg);
              return #err(#invalidState(msg));
            };
            if (Principal.equal(caller, record.createdBy) or Principal.equal(caller, record.lastModifiedBy)) {
              let msg = "核实人不能是当前版本的创建人或最后修改人";
              AuditLib.log(state, caller, #verifyRecord, titleOf(record.data), ?record.companyId, #denied, ?msg);
              return #err(#selfVerificationDenied(msg));
            };
            let now = Time.now();
            let updated : Records.ArchiveRecord = {
              record with
              verification = ?{ verifier = caller; verifiedAt = now };
            };
            state.records.add(id, updated);
            addHistory(state, caller, updated, #verify, []);
            AuditLib.log(state, caller, #verifyRecord, titleOf(updated.data), ?updated.companyId, #success, null);
            let companyName = switch (state.companies.get(updated.companyId)) {
              case (?c) c.name;
              case null "";
            };
            NotificationsLib.notify(
              state,
              updated.maintainer,
              #verified,
              "【" # companyName # "】记录 #" # updated.id.toText() # " 已核实。",
              ?updated.companyId,
              ?updated.id,
              null,
              null,
            );
            #ok(toView(state, caller, updated));
          };
        };
      };
    };
  };

  /// Requires 查看; ID numbers masked.
  public func history(state : State.State, caller : Principal, id : Common.RecordId) : Errors.ApiResult<[Records.ChangeEntryView]> {
    switch (state.records.get(id)) {
      case null {
        switch (Access.requireApproved(state, caller, #viewHistory, "变更历史", null)) {
          case (#err e) #err e;
          case (#ok _) {
            AuditLib.log(state, caller, #viewHistory, "记录 #" # id.toText(), null, #denied, ?"记录不存在");
            #err(#notFound("记录不存在"));
          };
        };
      };
      case (?record) {
        switch (Access.requirePermission(state, caller, record.companyId, #view, #viewHistory, "变更历史")) {
          case (#err e) #err e;
          case (#ok _) {
            let entries = state.history.toArray().filter(func (e : Records.ChangeEntry) : Bool {
              e.recordId == id;
            });
            let sorted = entries.sort(func (a : Records.ChangeEntry, b : Records.ChangeEntry) : { #less; #equal; #greater } {
              if (a.id > b.id) #less else if (a.id < b.id) #greater else #equal;
            });
            AuditLib.log(state, caller, #viewHistory, titleOf(record.data), ?record.companyId, #success, null);
            #ok(sorted.map(func (e : Records.ChangeEntry) : Records.ChangeEntryView {
              {
                id = e.id;
                recordId = e.recordId;
                editor = e.editor;
                editorName = Access.displayName(state, e.editor);
                at = e.at;
                resultingVersion = e.resultingVersion;
                action = e.action;
                actionLabel = Labels.changeActionLabel(e.action);
                changes = e.changes;
              };
            }));
          };
        };
      };
    };
  };

  /// Requires 敏感下载 on the record's company; success is audited as a sensitive view, denial audited too.
  public func viewIdNumber(state : State.State, caller : Principal, id : Common.RecordId) : Errors.ApiResult<Text> {
    switch (state.records.get(id)) {
      case null {
        switch (Access.requireApproved(state, caller, #viewSensitive, "查看身份证号", null)) {
          case (#err e) #err e;
          case (#ok _) {
            AuditLib.log(state, caller, #viewSensitive, "记录 #" # id.toText(), null, #denied, ?"记录不存在");
            #err(#notFound("记录不存在"));
          };
        };
      };
      case (?record) {
        switch (Access.requirePermission(state, caller, record.companyId, #sensitiveDownload, #viewSensitive, "查看身份证号")) {
          case (#err e) #err e;
          case (#ok _) {
            switch (record.data) {
              case (#person(d)) {
                AuditLib.log(state, caller, #viewSensitive, titleOf(record.data), ?record.companyId, #success, null);
                #ok(d.idNumber);
              };
              case _ {
                AuditLib.log(state, caller, #viewSensitive, titleOf(record.data), ?record.companyId, #denied, ?"该记录没有身份证号");
                #err(#invalidState("该记录没有身份证号"));
              };
            };
          };
        };
      };
    };
  };

  /// Shared with attachments: bump version, reset to 待核, clear verification, add history, notify maintainer.
  public func resetToPending(state : State.State, caller : Principal, record : Records.ArchiveRecord, action : Records.ChangeAction, changes : [Records.FieldChange]) : Records.ArchiveRecord {
    let now = Time.now();
    let updated : Records.ArchiveRecord = {
      record with
      version = record.version + 1;
      verification = null;
      lastModifiedBy = caller;
      lastModifiedAt = now;
    };
    state.records.add(updated.id, updated);
    addHistory(state, caller, updated, action, changes);
    let companyName = switch (state.companies.get(updated.companyId)) {
      case (?c) c.name;
      case null "";
    };
    NotificationsLib.notify(
      state,
      updated.maintainer,
      #resetToPending,
      "【" # companyName # "】记录 #" # updated.id.toText() # " 附件已变更，已重置为待核，请重新核实。",
      ?updated.companyId,
      ?updated.id,
      null,
      null,
    );
    updated;
  };
};
