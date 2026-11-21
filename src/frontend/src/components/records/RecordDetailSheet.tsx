import type { RecordView } from "@/backend";
import { AttachmentPanel } from "@/components/records/AttachmentPanel";
import { RecordHistory } from "@/components/records/RecordHistory";
import { RecordBadges } from "@/components/records/StatusBadge";
import { VerifyButton } from "@/components/records/VerifyButton";
import { KIND_CONFIGS } from "@/components/records/kindConfig";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  formatDate,
  formatDateTime,
  formatFen,
  maskIdNumber,
} from "@/lib/format";
import { PROJECT_TYPE_LABELS } from "@/lib/labels";
import { Pencil } from "lucide-react";

function dataRows(record: RecordView): { label: string; value: string }[] {
  const config = KIND_CONFIGS[record.kind];
  const data = record.data;
  const raw: Record<string, string> = {};
  switch (data.__kind__) {
    case "license":
      raw.name = data.license.name;
      raw.number = data.license.number;
      raw.category = data.license.category;
      raw.issuingAuthority = data.license.issuingAuthority;
      raw.validFrom = formatDate(data.license.validFrom);
      raw.validTo = formatDate(data.license.validTo);
      break;
    case "companyTrack":
      raw.projectName = data.companyTrack.projectName;
      raw.owner = data.companyTrack.owner;
      raw.projectType = data.companyTrack.projectType
        ? PROJECT_TYPE_LABELS[data.companyTrack.projectType]
        : "—";
      raw.contractAmountFen = formatFen(data.companyTrack.contractAmountFen);
      raw.completionDate = formatDate(data.companyTrack.completionDate);
      break;
    case "person":
      raw.name = data.person.name;
      raw.idNumber = maskIdNumber(data.person.idNumber);
      raw.phone = data.person.phone || "—";
      raw.position = data.person.position || "—";
      break;
    case "personCert":
      raw.category = data.personCert.category;
      raw.number = data.personCert.number;
      raw.issuingAuthority = data.personCert.issuingAuthority;
      raw.validFrom = formatDate(data.personCert.validFrom);
      raw.validTo = formatDate(data.personCert.validTo);
      break;
    case "personTrack":
      raw.projectName = data.personTrack.projectName;
      raw.role = data.personTrack.role;
      raw.completionDate = formatDate(data.personTrack.completionDate);
      break;
  }
  return config.fields.map((f) => ({
    label: f.label,
    value: raw[f.key] || "—",
  }));
}

export function RecordDetailSheet({
  record,
  open,
  onOpenChange,
  canEdit,
  canVerify,
  canSensitiveDownload,
  onEdit,
}: {
  record: RecordView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
  canVerify: boolean;
  canSensitiveDownload: boolean;
  onEdit?: (record: RecordView) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        data-ocid="record.detail.sheet"
        className="w-full overflow-y-auto sm:max-w-lg"
      >
        {record && (
          <>
            <SheetHeader className="border-b border-border">
              <SheetTitle className="pr-8 text-base">{record.title}</SheetTitle>
              <SheetDescription className="text-xs">
                {record.companyName} · {record.kindLabel}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <RecordBadges
                  status={record.status}
                  expiryFlag={record.expiryFlag}
                />
              </div>
            </SheetHeader>

            <div className="space-y-5 px-4 pb-6">
              <div className="flex flex-wrap gap-2">
                {canEdit && onEdit && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-ocid="record.detail.edit_button"
                    onClick={() => onEdit(record)}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    编辑
                  </Button>
                )}
                <VerifyButton
                  record={record}
                  allowed={canVerify}
                  deniedReason="缺少「核实」权限，或该档案由您本人创建/修改，不能自核。"
                />
              </div>

              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                {dataRows(record).map((row) => (
                  <div key={row.label} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">
                      {row.label}
                    </dt>
                    <dd className="truncate text-sm text-foreground">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {record.remarks && (
                <div>
                  <p className="text-xs text-muted-foreground">备注</p>
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {record.remarks}
                  </p>
                </div>
              )}

              <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                维护责任人 {record.maintainerName} · 版本{" "}
                {record.version.toString()} · 最后修改{" "}
                {record.lastModifiedByName}{" "}
                {formatDateTime(record.lastModifiedAt)}
                {record.verification && (
                  <>
                    <br />
                    核实人 {record.verification.verifierName} ·{" "}
                    {formatDateTime(record.verification.verifiedAt)}
                  </>
                )}
              </div>

              <AttachmentPanel
                record={record}
                canEdit={canEdit}
                canSensitiveDownload={canSensitiveDownload}
              />

              <RecordHistory recordId={record.id} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
