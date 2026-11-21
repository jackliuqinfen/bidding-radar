import type { AttachmentView, RecordView } from "@/backend";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  useAddAttachment,
  useDownloadAttachment,
  useReplaceAttachment,
} from "@/hooks/useAttachments";
import { describeError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ExternalBlob } from "@caffeineai/object-storage";
import {
  Download,
  FileText,
  Loader2,
  Lock,
  Paperclip,
  RefreshCw,
  Upload,
} from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";

function saveBlob(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes as BlobPart]);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function AttachmentRow({
  attachment,
  canSensitiveDownload,
}: {
  attachment: AttachmentView;
  canSensitiveDownload: boolean;
}) {
  const download = useDownloadAttachment();
  const [error, setError] = useState<string | null>(null);
  const blocked = attachment.sensitive && !canSensitiveDownload;

  const handleDownload = (version: bigint | null) => {
    setError(null);
    download.mutate(
      { attachmentId: attachment.id, version },
      {
        onSuccess: (info) => {
          void info.blob
            .getBytes()
            .then((bytes) => saveBlob(bytes, info.fileName));
        },
        onError: (err) => setError(describeError(err)),
      },
    );
  };

  return (
    <li className="rounded-md border border-border bg-card px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
            <FileText
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            {attachment.fileName}
            {attachment.sensitive && (
              <span className="inline-flex items-center gap-0.5 rounded-sm border border-status-expiring-border bg-status-expiring-soft px-1 text-[10px] text-status-expiring-foreground">
                <Lock className="size-2.5" aria-hidden="true" />
                敏感
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            当前版本 v{attachment.currentVersion.toString()} · 共{" "}
            {attachment.versions.length} 个版本
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          data-ocid="attachment.download_button"
          disabled={blocked || download.isPending}
          title={blocked ? "缺少「敏感下载」权限" : undefined}
          onClick={() => handleDownload(null)}
        >
          {download.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="size-3.5" aria-hidden="true" />
          )}
          下载
        </Button>
      </div>
      {attachment.versions.length > 1 && (
        <ul className="mt-1.5 space-y-0.5 border-t border-border pt-1.5">
          {attachment.versions.map((v) => (
            <li
              key={v.version.toString()}
              className="flex items-center justify-between gap-2 text-xs text-muted-foreground"
            >
              <span className="truncate">
                v{v.version.toString()} · {v.uploaderName} ·{" "}
                {formatDateTime(v.uploadedAt)}
                {v.note ? ` · ${v.note}` : ""}
              </span>
              <button
                type="button"
                className="shrink-0 text-primary hover:underline disabled:opacity-50"
                disabled={blocked || download.isPending}
                onClick={() => handleDownload(v.version)}
              >
                下载此版本
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </li>
  );
}

export function AttachmentPanel({
  record,
  canEdit,
  canSensitiveDownload,
}: {
  record: RecordView;
  canEdit: boolean;
  canSensitiveDownload: boolean;
}) {
  const addAttachment = useAddAttachment();
  const replaceAttachment = useReplaceAttachment();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [sensitive, setSensitive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replacingId, setReplacingId] = useState<bigint | null>(null);

  const upload = async (file: File, replaceId: bigint | null) => {
    setError(null);
    setProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(
        bytes,
        file.type,
        file.name,
      ).withUploadProgress((pct) => setProgress(pct));
      if (replaceId !== null) {
        await replaceAttachment.mutateAsync({
          blob,
          note: "换版",
          fileName: file.name,
          attachmentId: replaceId,
          expectedRecordVersion: record.version,
        });
      } else {
        await addAttachment.mutateAsync({
          blob,
          note: "",
          fileName: file.name,
          recordId: record.id,
          sensitive,
        });
      }
      setProgress(null);
      setSensitive(false);
    } catch (err) {
      setProgress(null);
      setError(describeError(err));
    }
  };

  const onPickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void upload(file, null);
  };

  const onPickReplace = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file && replacingId !== null) void upload(file, replacingId);
  };

  const busy = addAttachment.isPending || replaceAttachment.isPending;

  return (
    <section data-ocid="attachment.panel" className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Paperclip
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          附件
          <span className="text-xs font-normal text-muted-foreground">
            ({record.attachments.length})
          </span>
        </h3>
        {canEdit && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={sensitive}
                onChange={(e) => setSensitive(e.target.checked)}
                className="size-3.5 accent-primary"
              />
              敏感
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-ocid="attachment.upload_button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-3.5" aria-hidden="true" />
              上传
            </Button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onPickFile}
        aria-label="选择要上传的附件"
      />
      <input
        ref={replaceInputRef}
        type="file"
        className="hidden"
        onChange={onPickReplace}
        aria-label="选择换版文件"
      />

      {progress !== null && (
        <div className="space-y-1" data-ocid="attachment.upload_progress">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            上传中 {Math.round(progress)}%
          </p>
        </div>
      )}

      {error && (
        <p
          role="alert"
          data-ocid="attachment.error_state"
          className="text-xs text-destructive"
        >
          {error}
        </p>
      )}

      {record.attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无附件。</p>
      ) : (
        <ul className="space-y-2">
          {record.attachments.map((attachment) => (
            <li key={attachment.id.toString()} className="space-y-1">
              <AttachmentRow
                attachment={attachment}
                canSensitiveDownload={canSensitiveDownload}
              />
              {canEdit && (
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50",
                  )}
                  disabled={busy}
                  onClick={() => {
                    setReplacingId(attachment.id);
                    replaceInputRef.current?.click();
                  }}
                >
                  <RefreshCw className="size-3" aria-hidden="true" />
                  换版（保留历史版本）
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
