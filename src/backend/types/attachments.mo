import Storage "mo:caffeineai-object-storage/Storage";
import Common "common";

module {
  /// One stored file version. Older versions are always kept.
  public type AttachmentVersion = {
    version : Nat;
    blob : Storage.ExternalBlob;
    uploader : Principal;
    uploadedAt : Common.Timestamp;
    fileName : Text;
    note : Text;
    /// true for 【虚构】 sample attachments whose blob is a placeholder, not a gateway upload
    isSample : Bool;
  };

  /// Stored attachment; `versions` is ordered oldest first, last = current.
  public type Attachment = {
    id : Common.AttachmentId;
    recordId : Common.RecordId;
    companyId : Common.CompanyId;
    sensitive : Bool;
    createdAt : Common.Timestamp;
    versions : [AttachmentVersion];
  };

  /// Version metadata only (never carries the blob).
  public type AttachmentVersionMeta = {
    version : Nat;
    uploader : Principal;
    uploaderName : Text;
    uploadedAt : Common.Timestamp;
    fileName : Text;
    note : Text;
    isSample : Bool;
  };

  public type AttachmentView = {
    id : Common.AttachmentId;
    recordId : Common.RecordId;
    companyId : Common.CompanyId;
    sensitive : Bool;
    currentVersion : Nat;
    fileName : Text;
    versions : [AttachmentVersionMeta];
    /// whether the caller may download/preview it (敏感下载 for sensitive, 查看 otherwise)
    canDownload : Bool;
  };

  /// Returned only to authorized callers.
  public type DownloadInfo = {
    attachmentId : Common.AttachmentId;
    version : Nat;
    fileName : Text;
    sensitive : Bool;
    isSample : Bool;
    blob : Storage.ExternalBlob;
  };

  public type NewAttachmentInput = {
    recordId : Common.RecordId;
    fileName : Text;
    sensitive : Bool;
    note : Text;
    blob : Storage.ExternalBlob;
  };

  public type ReplaceAttachmentInput = {
    attachmentId : Common.AttachmentId;
    /// record version the caller last saw
    expectedRecordVersion : Nat;
    fileName : Text;
    note : Text;
    blob : Storage.ExternalBlob;
  };
};
