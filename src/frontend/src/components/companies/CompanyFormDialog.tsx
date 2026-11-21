import type { CompanyInput, CompanyView } from "@/backend";
import {
  CompanyForm,
  type CompanyFormValues,
  companyValuesFrom,
  emptyCompanyValues,
} from "@/components/companies/CompanyForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateCompany,
  useUpdateCompany,
} from "@/hooks/useCompanyMutations";
import { describeError } from "@/lib/errors";
import { Principal } from "@icp-sdk/core/principal";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Create or edit a company profile. The form keeps its draft on every failure;
 * the dialog only closes after a successful save.
 */
export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  maintainer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing company. */
  company?: CompanyView;
  /** Principal recorded as 维护责任人 for a new company. */
  maintainer: string;
}) {
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const [error, setError] = useState<string | undefined>(undefined);

  const isEdit = !!company;
  const pending = createCompany.isPending || updateCompany.isPending;

  const handleSubmit = (values: CompanyFormValues) => {
    setError(undefined);
    if (company) {
      const input: CompanyInput = {
        ...values,
        maintainer: company.maintainer,
      };
      updateCompany.mutate(
        { id: company.id, input },
        {
          onSuccess: () => {
            toast.success("公司资料已更新");
            onOpenChange(false);
          },
          onError: (err) => setError(describeError(err)),
        },
      );
      return;
    }
    const input: CompanyInput = {
      ...values,
      maintainer: Principal.fromText(maintainer),
    };
    createCompany.mutate(input, {
      onSuccess: () => {
        toast.success("公司已创建");
        onOpenChange(false);
      },
      onError: (err) => setError(describeError(err)),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(undefined);
        onOpenChange(next);
      }}
    >
      <DialogContent
        data-ocid="company.form.dialog"
        className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑公司资料" : "新建公司"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "修改公司档案的基本信息，保存后立即生效。"
              : "登记集团成员公司，创建后可继续补充证照资质与企业业绩。"}
          </DialogDescription>
        </DialogHeader>
        <CompanyForm
          key={company ? company.id.toString() : "new"}
          initialValues={
            company ? companyValuesFrom(company) : emptyCompanyValues()
          }
          submitLabel={isEdit ? "保存修改" : "创建公司"}
          pending={pending}
          error={error}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
