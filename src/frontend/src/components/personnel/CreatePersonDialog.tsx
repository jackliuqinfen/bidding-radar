import { RecordKind } from "@/backend";
import { RecordForm } from "@/components/records/RecordForm";
import { emptyFormValues } from "@/components/records/formData";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateRecord } from "@/hooks/useRecordMutations";
import { describeError } from "@/lib/errors";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useState } from "react";
import { toast } from "sonner";

export function CreatePersonDialog({
  companyId,
  companyName,
  open,
  onOpenChange,
}: {
  companyId: bigint;
  companyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { identity } = useInternetIdentity();
  const create = useCreateRecord();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (payload: {
    values: Record<string, string>;
    remarks: string;
  }) => {
    const principal = identity?.getPrincipal();
    if (!principal) {
      setError("登录状态已失效，请重新登录。");
      return;
    }
    setError(null);
    create.mutate(
      {
        companyId,
        maintainer: principal,
        remarks: payload.remarks,
        data: {
          __kind__: "person",
          person: {
            name: payload.values.name?.trim() ?? "",
            idNumber: payload.values.idNumber?.trim() ?? "",
            phone: payload.values.phone?.trim() ?? "",
            position: payload.values.position?.trim() ?? "",
          },
        },
      },
      {
        onSuccess: (record) => {
          toast.success(`已新增人员「${record.title}」`);
          onOpenChange(false);
        },
        onError: (err) => setError(describeError(err)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="personnel.create.dialog"
        className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>新增人员</DialogTitle>
          <DialogDescription>
            归属单位：{companyName}。保存后状态为待核。
          </DialogDescription>
        </DialogHeader>
        <RecordForm
          kind={RecordKind.person}
          initialValues={emptyFormValues(RecordKind.person)}
          submitLabel="保存人员"
          pending={create.isPending}
          error={error ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function AddPersonButton({
  companyId,
  companyName,
}: {
  companyId: bigint;
  companyName: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        data-ocid="personnel.add_button"
        onClick={() => setOpen(true)}
      >
        新增人员
      </Button>
      <CreatePersonDialog
        companyId={companyId}
        companyName={companyName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
