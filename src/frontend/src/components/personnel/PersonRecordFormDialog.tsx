import type { RecordView } from "@/backend";
import type { RecordKind } from "@/backend";
import { RecordForm } from "@/components/records/RecordForm";
import {
  type FormValues,
  buildRecordData,
  emptyFormValues,
} from "@/components/records/formData";
import { KIND_CONFIGS } from "@/components/records/kindConfig";
import { Button } from "@/components/ui/button";
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
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useState } from "react";
import { toast } from "sonner";

/** Prefill form values from an existing record (never the masked ID number). */
function valuesFromRecord(record: RecordView): FormValues {
  const values = emptyFormValues(record.kind);
  const data = record.data;
  switch (data.__kind__) {
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
    case "person":
      values.name = data.person.name;
      values.phone = data.person.phone;
      values.position = data.person.position;
      break;
    default:
      break;
  }
  return values;
}

function maskedIdOf(record: RecordView | null): string | undefined {
  if (record?.data.__kind__ === "person" && record.data.person.idNumber) {
    return record.data.person.idNumber;
  }
  return undefined;
}

export function PersonRecordFormDialog({
  kind,
  personId,
  companyId,
  record,
  open,
  onOpenChange,
}: {
  kind: RecordKind.person | RecordKind.personCert | RecordKind.personTrack;
  personId: bigint;
  companyId: bigint;
  /** Existing record when editing; null when creating. */
  record: RecordView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { identity } = useInternetIdentity();
  const create = useCreateRecord();
  const update = useUpdateRecord();
  const [error, setError] = useState<string | null>(null);
  const [conflictLatest, setConflictLatest] = useState<RecordView | null>(null);
  const [expectedVersion, setExpectedVersion] = useState<bigint | null>(
    record?.version ?? null,
  );

  const isEdit = record !== null;
  const pending = create.isPending || update.isPending;
  const config = KIND_CONFIGS[kind];

  const handleSubmit = (payload: {
    values: FormValues;
    remarks: string;
  }) => {
    const principal = identity?.getPrincipal();
    if (!principal) {
      setError("登录状态已失效，请重新登录。");
      return;
    }
    setError(null);

    const built = buildRecordData(kind, payload.values);
    // Attach the real person id for child records.
    let data = built;
    if (built.__kind__ === "personCert") {
      data = {
        __kind__: "personCert",
        personCert: { ...built.personCert, personId },
      };
    } else if (built.__kind__ === "personTrack") {
      data = {
        __kind__: "personTrack",
        personTrack: { ...built.personTrack, personId },
      };
    } else if (built.__kind__ === "person") {
      // Only submit a new ID number when the user typed a complete one; the
      // masked placeholder is never sent as a value.
      const typed = payload.values.idNumber?.trim() ?? "";
      const existing =
        record?.data.__kind__ === "person" ? record.data.person.idNumber : "";
      data = {
        __kind__: "person",
        person: {
          ...built.person,
          idNumber: typed.length > 0 ? typed : existing,
        },
      };
    }

    const onError = (err: unknown) => {
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
    };

    if (isEdit && record) {
      update.mutate(
        {
          id: record.id,
          expectedVersion: expectedVersion ?? record.version,
          change: { data, maintainer: principal, remarks: payload.remarks },
        },
        {
          onSuccess: () => {
            toast.success("已保存修改");
            onOpenChange(false);
          },
          onError,
        },
      );
    } else {
      create.mutate(
        {
          companyId,
          maintainer: principal,
          remarks: payload.remarks,
          data,
        },
        {
          onSuccess: () => {
            toast.success(`已新增${config.label}`);
            onOpenChange(false);
          },
          onError,
        },
      );
    }
  };

  const initialValues = record
    ? valuesFromRecord(record)
    : emptyFormValues(kind);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="person.record.form.dialog"
        className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `编辑${config.label}` : `新增${config.label}`}
          </DialogTitle>
          <DialogDescription>
            {kind === "person"
              ? "身份证号已脱敏显示，仅在输入新号码时提交。"
              : "保存后状态为待核，需由具备核实权限的成员核实。"}
          </DialogDescription>
        </DialogHeader>
        <RecordForm
          kind={kind}
          initialValues={initialValues}
          initialRemarks={record?.remarks ?? ""}
          maskedIdNumber={maskedIdOf(record)}
          submitLabel={isEdit ? "保存修改" : "保存"}
          pending={pending}
          error={error ?? undefined}
          conflictLatest={conflictLatest ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          onResubmitConflict={() => {
            setConflictLatest(null);
            setError(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
