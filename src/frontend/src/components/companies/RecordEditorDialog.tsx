import type { RecordKind, RecordView } from "@/backend";
import {
  RecordForm,
  type RecordFormSubmit,
  buildRecordData,
} from "@/components/records/RecordForm";
import { emptyFormValues } from "@/components/records/formData";
import { KIND_CONFIGS } from "@/components/records/kindConfig";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateRecord, useUpdateRecord } from "@/hooks/useRecordMutations";
import { describeError } from "@/lib/errors";
import { timestampToDateInput } from "@/lib/format";
import { Principal } from "@icp-sdk/core/principal";
import { useState } from "react";
import { toast } from "sonner";

/** Map a stored record back into editable string form values. */
function valuesFromRecord(record: RecordView): Record<string, string> {
  const values = emptyFormValues(record.kind);
  const data = record.data;
  switch (data.__kind__) {
    case "license":
      values.name = data.license.name;
      values.number = data.license.number;
      values.category = data.license.category;
      values.issuingAuthority = data.license.issuingAuthority;
      values.validFrom = timestampToDateInput(data.license.validFrom);
      values.validTo = timestampToDateInput(data.license.validTo);
      break;
    case "companyTrack":
      values.projectName = data.companyTrack.projectName;
      values.owner = data.companyTrack.owner;
      values.projectType = data.companyTrack.projectType ?? "";
      values.contractAmountFen =
        data.companyTrack.contractAmountFen !== undefined
          ? (Number(data.companyTrack.contractAmountFen) / 100).toFixed(2)
          : "";
      values.completionDate = timestampToDateInput(
        data.companyTrack.completionDate,
      );
      break;
    case "person":
      values.name = data.person.name;
      values.phone = data.person.phone;
      values.position = data.person.position;
      break;
    case "personCert":
      values.category = data.personCert.category;
      values.number = data.personCert.number;
      values.issuingAuthority = data.personCert.issuingAuthority;
      values.validFrom = timestampToDateInput(data.personCert.validFrom);
      values.validTo = timestampToDateInput(data.personCert.validTo);
      break;
    case "personTrack":
      values.projectName = data.personTrack.projectName;
      values.role = data.personTrack.role;
      values.completionDate = timestampToDateInput(
        data.personTrack.completionDate,
      );
      break;
  }
  return values;
}

function maskedId(record: RecordView): string | undefined {
  return record.data.__kind__ === "person"
    ? record.data.person.idNumber
    : undefined;
}

/**
 * Create or edit a company record (证照资质 / 企业业绩). The form retains the
 * user's input on every failure; a version conflict shows the latest values
 * beside the retained input and allows re-submitting against the new version.
 */
export function RecordEditorDialog({
  open,
  onOpenChange,
  kind,
  companyId,
  maintainer,
  record,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: RecordKind;
  companyId: bigint;
  maintainer: string;
  /** Present when editing an existing record. */
  record?: RecordView;
}) {
  const createRecord = useCreateRecord();
  const updateRecord = useUpdateRecord();
  const [error, setError] = useState<string | undefined>(undefined);
  const [conflictLatest, setConflictLatest] = useState<RecordView | undefined>(
    undefined,
  );
  const [expectedVersion, setExpectedVersion] = useState<bigint | undefined>(
    record?.version,
  );
  const [lastSubmit, setLastSubmit] = useState<RecordFormSubmit | undefined>(
    undefined,
  );

  const pending = createRecord.isPending || updateRecord.isPending;
  const config = KIND_CONFIGS[kind];

  const reset = () => {
    setError(undefined);
    setConflictLatest(undefined);
    setExpectedVersion(record?.version);
    setLastSubmit(undefined);
  };

  const save = (payload: RecordFormSubmit, version: bigint | undefined) => {
    setError(undefined);
    setLastSubmit(payload);
    const data = buildRecordData(kind, payload.values);
    if (record && version !== undefined) {
      updateRecord.mutate(
        {
          id: record.id,
          expectedVersion: version,
          change: {
            data,
            remarks: payload.remarks,
            maintainer: Principal.fromText(maintainer),
          },
        },
        {
          onSuccess: () => {
            toast.success("档案已保存，状态已退回待核");
            onOpenChange(false);
          },
          onError: (err) => {
            if (err && typeof err === "object" && "__kind__" in err) {
              const apiErr = err as {
                __kind__: string;
                conflict?: { latest: RecordView };
              };
              if (apiErr.__kind__ === "conflict" && apiErr.conflict) {
                setConflictLatest(apiErr.conflict.latest);
                setExpectedVersion(apiErr.conflict.latest.version);
                return;
              }
            }
            setError(describeError(err));
          },
        },
      );
      return;
    }
    createRecord.mutate(
      {
        data,
        remarks: payload.remarks,
        maintainer: Principal.fromText(maintainer),
        companyId,
      },
      {
        onSuccess: () => {
          toast.success("档案已创建，等待核实");
          onOpenChange(false);
        },
        onError: (err) => setError(describeError(err)),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        data-ocid="record.editor.dialog"
        className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>
            {record ? `编辑${config.label}` : `新建${config.label}`}
          </DialogTitle>
          <DialogDescription>
            {record
              ? "实质修改保存后将退回待核，需由他人重新核实。"
              : `为该公司登记一条${config.label}档案，创建后进入待核状态。`}
          </DialogDescription>
        </DialogHeader>
        <RecordForm
          key={record ? record.id.toString() : `new-${kind}`}
          kind={kind}
          initialValues={
            record ? valuesFromRecord(record) : emptyFormValues(kind)
          }
          initialRemarks={record?.remarks ?? ""}
          maskedIdNumber={record ? maskedId(record) : undefined}
          submitLabel={record ? "保存修改" : "创建档案"}
          pending={pending}
          error={error}
          conflictLatest={conflictLatest}
          onSubmit={(payload) => save(payload, expectedVersion)}
          onCancel={() => onOpenChange(false)}
          onResubmitConflict={() => {
            if (lastSubmit) save(lastSubmit, expectedVersion);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
