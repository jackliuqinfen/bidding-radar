import type { CompanyView } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { describeError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";

export interface CompanyFormValues {
  name: string;
  creditCode: string;
  registeredPlace: string;
  contact: string;
}

export function emptyCompanyValues(): CompanyFormValues {
  return { name: "", creditCode: "", registeredPlace: "", contact: "" };
}

export function companyValuesFrom(company: CompanyView): CompanyFormValues {
  return {
    name: company.name,
    creditCode: company.creditCode,
    registeredPlace: company.registeredPlace,
    contact: company.contact,
  };
}

const FIELDS: {
  key: keyof CompanyFormValues;
  label: string;
  placeholder: string;
  required?: boolean;
  help?: string;
}[] = [
  {
    key: "name",
    label: "公司名称",
    placeholder: "如：华建集团有限公司",
    required: true,
  },
  {
    key: "creditCode",
    label: "统一社会信用代码",
    placeholder: "18 位统一社会信用代码",
    required: true,
    help: "18 位数字与大写字母组合",
  },
  {
    key: "registeredPlace",
    label: "注册地",
    placeholder: "如：浙江省杭州市",
  },
  { key: "contact", label: "联系方式", placeholder: "联系人及电话" },
];

/**
 * Company profile form. Owns its draft in local state so any save failure
 * (network, permission, validation) keeps exactly what the user typed.
 */
export function CompanyForm({
  initialValues,
  submitLabel = "保存",
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  initialValues: CompanyFormValues;
  submitLabel?: string;
  pending: boolean;
  error?: string;
  onSubmit: (values: CompanyFormValues) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<CompanyFormValues>(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setField = (key: keyof CompanyFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const missing = FIELDS.filter((f) => f.required && !values[f.key].trim());

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (missing.length > 0) {
      setTouched((prev) => {
        const next = { ...prev };
        for (const f of missing) next[f.key] = true;
        return next;
      });
      return;
    }
    onSubmit({
      name: values.name.trim(),
      creditCode: values.creditCode.trim().toUpperCase(),
      registeredPlace: values.registeredPlace.trim(),
      contact: values.contact.trim(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-ocid="company.form"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => {
          const value = values[field.key];
          const invalid =
            !!field.required && touched[field.key] && !value.trim();
          const fieldId = `company-field-${field.key}`;
          return (
            <div
              key={field.key}
              className={cn(
                "space-y-1.5",
                field.key === "name" && "sm:col-span-2",
              )}
            >
              <Label
                htmlFor={fieldId}
                className="text-xs text-muted-foreground"
              >
                {field.label}
                {field.required && (
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                )}
              </Label>
              <Input
                id={fieldId}
                data-ocid={`company.form.${field.key}.input`}
                value={value}
                placeholder={field.placeholder}
                aria-invalid={invalid}
                aria-required={field.required}
                autoComplete="off"
                onChange={(e) => setField(field.key, e.target.value)}
              />
              {field.help && !invalid && (
                <p className="text-xs text-muted-foreground">{field.help}</p>
              )}
              {invalid && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="company.form.error"
                >
                  请填写{field.label}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div
          role="alert"
          data-ocid="company.form.error_state"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-foreground"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            data-ocid="company.form.cancel_button"
            onClick={onCancel}
            disabled={pending}
          >
            取消
          </Button>
        )}
        <Button
          type="submit"
          data-ocid="company.form.submit_button"
          disabled={pending}
          className="w-full sm:w-auto"
        >
          {pending && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export { describeError };
