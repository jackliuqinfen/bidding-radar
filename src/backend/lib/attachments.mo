import Map "mo:core/Map";
import Time "mo:core/Time";
import Common "../types/common";
import State "../types/state";
import Attachments "../types/attachments";
import Records "../types/records";
import Audit "../types/audit";
import Errors "../types/errors";
import Access "access";
import AuditLib "audit";
import RecordsLib "records";

module {
  func currentVersion(attachment : Attachments.Attachment) : ?Attachments.AttachmentVersion {
    let n = attachment.versions.size();
    if (n == 0) return null;
    ?attachment.versions[n - 1];
  };

  func canDownload(state : State.State, caller : Principal, attachment : Attachments.Attachment) : Bool {
    if (attachment.sensitive) {
      Access.hasPermission(state, caller, attachment.companyId, #sensitiveDownload);
    } else {
      Access.hasPermission(state, caller, attachment.companyId, #view);
    };
  };

  /// Metadata for the caller (canDownload computed); never carries the blob.
  public func toView(state : State.State, caller : Principal, attachment : Attachments.Attachment) : Attachments.AttachmentView {
    let current = currentVersion(attachment);
    {
      id = attachment.id;
      recordId = attachment.recordId;
      companyId = attachment.companyId;
      sensitive = attachment.sensitive;
      currentVersion = switch (current) {
        case (?v) v.version;
        case null 0;
      };
      fileName = switch (current) {
        case (?v) v.fileName;
        case null "";
      };
      versions = attachment.versions.map(func (v : Attachments.AttachmentVersion) : Attachments.AttachmentVersionMeta {
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
      canDownload = canDownload(state, caller, attachment);
    };
  };

  public func forRecord(state : State.State, caller : Principal, recordId : Common.RecordId) : [Attachments.AttachmentView] {
    let all = state.attachments.values().toArray();
    let mine = all.filter(func (a : Attachments.Attachment) : Bool { a.recordId == recordId });
    let sorted = mine.sort(func (a : Attachments.Attachment, b : Attachments.Attachment) : { #less; #equal; #greater } {
      if (a.id < b.id) #less else if (a.id > b.id) #greater else #equal;
    });
    sorted.map(func (a : Attachments.Attachment) : Attachments.AttachmentView = toView(state, caller, a));
  };

  /// Requires 编辑. Creates attachment version 1 (flagged sensitive or not). Does not reset status. Audited + history.
  public func add(state : State.State, caller : Principal, input : Attachments.NewAttachmentInput) : Errors.ApiResult<Attachments.AttachmentView> {
    switch (state.records.get(input.recordId)) {
      case null {
        switch (Access.requireApproved(state, caller, #uploadAttachment, "上传附件", null)) {
          case (#err e) #err e;
          case (#ok _) {
            AuditLib.log(state, caller, #uploadAttachment, "记录 #" # input.recordId.toText(), null, #denied, ?"记录不存在");
            #err(#notFound("记录不存在"));
          };
        };
      };
      case (?record) {
        switch (Access.requirePermission(state, caller, record.companyId, #edit, #uploadAttachment, "上传附件")) {
          case (#err e) #err e;
          case (#ok _) {
            if (input.fileName.size() == 0) {
              AuditLib.log(state, caller, #uploadAttachment, "记录 #" # record.id.toText(), ?record.companyId, #denied, ?"文件名不能为空");
              return #err(#invalidInput("文件名不能为空"));
            };
            let id = state.counters.nextAttachmentId;
            state.counters.nextAttachmentId := id + 1;
            let now = Time.now();
            let attachment : Attachments.Attachment = {
              id;
              recordId = record.id;
              companyId = record.companyId;
              sensitive = input.sensitive;
              createdAt = now;
              versions = [{
                version = 1;
                blob = input.blob;
                uploader = caller;
                uploadedAt = now;
                fileName = input.fileName;
                note = input.note;
                isSample = false;
              }];
            };
            state.attachments.add(id, attachment);
            AuditLib.log(state, caller, #uploadAttachment, input.fileName, ?record.companyId, #success, null);
            #ok(toView(state, caller, attachment));
          };
        };
      };
    };
  };

  /// Requires 编辑 and the current record version; appends a new version keeping all older ones,
  /// resets the record to 待核, clears verifier, notifies 维护责任人. Audited + history.
  public func replace(state : State.State, caller : Principal, input : Attachments.ReplaceAttachmentInput) : Errors.ApiResult<Records.RecordView> {
    switch (state.attachments.get(input.attachmentId)) {
      case null {
        switch (Access.requireApproved(state, caller, #replaceAttachment, "替换附件", null)) {
          case (#err e) #err e;
          case (#ok _) {
            AuditLib.log(state, caller, #replaceAttachment, "附件 #" # input.attachmentId.toText(), null, #denied, ?"附件不存在");
            #err(#notFound("附件不存在"));
          };
        };
      };
      case (?attachment) {
        switch (state.records.get(attachment.recordId)) {
          case null {
            AuditLib.log(state, caller, #replaceAttachment, "附件 #" # attachment.id.toText(), ?attachment.companyId, #denied, ?"记录不存在");
            #err(#notFound("记录不存在"));
          };
          case (?record) {
            switch (Access.requirePermission(state, caller, record.companyId, #edit, #replaceAttachment, "替换附件")) {
              case (#err e) #err e;
              case (#ok _) {
                if (input.expectedRecordVersion != record.version) {
                  AuditLib.log(state, caller, #replaceAttachment, "附件 #" # attachment.id.toText(), ?record.companyId, #denied, ?"版本冲突");
                  return #err(#conflict({ latest = RecordsLib.toView(state, caller, record) }));
                };
                if (input.fileName.size() == 0) {
                  AuditLib.log(state, caller, #replaceAttachment, "附件 #" # attachment.id.toText(), ?record.companyId, #denied, ?"文件名不能为空");
                  return #err(#invalidInput("文件名不能为空"));
                };
                let now = Time.now();
                let nextVersion = attachment.versions.size() + 1;
                let newVersion : Attachments.AttachmentVersion = {
                  version = nextVersion;
                  blob = input.blob;
                  uploader = caller;
                  uploadedAt = now;
                  fileName = input.fileName;
                  note = input.note;
                  isSample = false;
                };
                let updatedAttachment : Attachments.Attachment = {
                  attachment with
                  versions = attachment.versions.concat([newVersion]);
                };
                state.attachments.add(attachment.id, updatedAttachment);
                let changes : [Records.FieldChange] = [{
                  field = "附件";
                  before = switch (currentVersion(attachment)) { case (?v) v.fileName; case null "" };
                  after = input.fileName;
                }];
                let updatedRecord = RecordsLib.resetToPending(state, caller, record, #attachmentReplaced, changes);
                AuditLib.log(state, caller, #replaceAttachment, input.fileName, ?record.companyId, #success, null);
                #ok(RecordsLib.toView(state, caller, updatedRecord));
              };
            };
          };
        };
      };
    };
  };

  /// 敏感下载 for sensitive attachments, 查看 otherwise; version null = current. Every success and denial is audited.
  public func download(state : State.State, caller : Principal, attachmentId : Common.AttachmentId, version : ?Nat) : Errors.ApiResult<Attachments.DownloadInfo> {
    switch (state.attachments.get(attachmentId)) {
      case null {
        switch (Access.requireApproved(state, caller, #downloadAttachment, "下载附件", null)) {
          case (#err e) #err e;
          case (#ok _) {
            AuditLib.log(state, caller, #downloadAttachment, "附件 #" # attachmentId.toText(), null, #denied, ?"附件不存在");
            #err(#notFound("附件不存在"));
          };
        };
      };
      case (?attachment) {
        let required : Common.Permission = if (attachment.sensitive) #sensitiveDownload else #view;
        switch (Access.requirePermission(state, caller, attachment.companyId, required, #downloadAttachment, "下载附件")) {
          case (#err e) #err e;
          case (#ok _) {
            let target = switch (version) {
              case (?v) attachment.versions.find(func (av : Attachments.AttachmentVersion) : Bool { av.version == v });
              case null currentVersion(attachment);
            };
            switch (target) {
              case (?v) {
                AuditLib.log(state, caller, #downloadAttachment, v.fileName, ?attachment.companyId, #success, null);
                #ok({
                  attachmentId = attachment.id;
                  version = v.version;
                  fileName = v.fileName;
                  sensitive = attachment.sensitive;
                  isSample = v.isSample;
                  blob = v.blob;
                });
              };
              case null {
                AuditLib.log(state, caller, #downloadAttachment, "附件 #" # attachment.id.toText(), ?attachment.companyId, #denied, ?"版本不存在");
                #err(#notFound("附件版本不存在"));
              };
            };
          };
        };
      };
    };
  };
};
