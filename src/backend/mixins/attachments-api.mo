import Common "../types/common";
import State "../types/state";
import Attachments "../types/attachments";
import Records "../types/records";
import Errors "../types/errors";
import AttachmentsLib "../lib/attachments";

mixin (state : State.State) {
  /// Requires 编辑. The blob comes from the object-storage upload.
  public shared ({ caller }) func addAttachment(input : Attachments.NewAttachmentInput) : async Errors.ApiResult<Attachments.AttachmentView> {
    AttachmentsLib.add(state, caller, input);
  };

  /// Requires 编辑; keeps older versions; record returns to 待核.
  public shared ({ caller }) func replaceAttachment(input : Attachments.ReplaceAttachmentInput) : async Errors.ApiResult<Records.RecordView> {
    AttachmentsLib.replace(state, caller, input);
  };

  /// Blob reference only for authorized callers; every attempt audited. version null = current.
  public shared ({ caller }) func downloadAttachment(attachmentId : Common.AttachmentId, version : ?Nat) : async Errors.ApiResult<Attachments.DownloadInfo> {
    AttachmentsLib.download(state, caller, attachmentId, version);
  };
};
