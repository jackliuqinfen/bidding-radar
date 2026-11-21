import type { RecordKind, RecordView } from "@/backend";
import { ConflictBanner } from "@/components/records/ConflictBanner";
import {
  type FormValues,
  buildRecordData,
} from "@/components/records/formData";
import { KIND_CONFIGS } from "@/components/records/kindConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { describeError } from "@/lib/errors";
import { maskIdNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";

export interface RecordFormSubmit {
  values: FormValues;
  remarks: string;
}

export function RecordForm({
  kind,
  initialValues,
  initialRemarks = "",
  maskedIdNumber,
  submitLabel = "保存",
  pending,
  error,
  conflictLatest,
  onSubmit,
  onCancel,
  onResubmitConflict,
}: {
  kind: RecordKind;
  initialValues: FormValues;
  initialRemarks?: string;
  /** Masked ID number shown for an existing person record. */
  maskedIdNumber?: string;
  submitLabel?: string;
  pending: boolean;
  error?: string;
  conflictLatest?: RecordView;
  onSubmit: (payload: RecordFormSubmit) => void;
  onCancel?: () => void;
  onResubmitConflict?: () => void;
}) {
  const config = KIND_CONFIGS[kind];
  const [values, setValues] = useState<FormValues>(initialValues);
  const [remarks, setRemarks] = useState(initialRemarks);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setField = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const missingRequired = config.fields.filter(
    (f) => f.required && !(values[f.key] ?? "").trim(),
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (missingRequired.length > 0) {
      setTouched((prev) => {
        const next = { ...prev };
        for (const f of missingRequired) next[f.key] = true;
        return next;
      });
      return;
    }
    onSubmit({ values, remarks });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-ocid="record.form">
      {conflictLatest && (
        <ConflictBanner
          latest={conflictLatest}
          onResubmit={onResubmitConflict}
          pending={pending}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {config.fields.map((field) => {
          const value = values[field.key] ?? "";
          const invalid = field.required && touched[field.key] && !value.trim();
          const fieldId = `record-field-${field.key}`;
          return (
            <div
              key={field.key}
              className={cn(
                "space-y-1.5",
                field.type === "textarea" && "sm:col-span-2",
              )}
            >
              <Label
                htmlFor={fieldId}
                className="text-xs text-muted-foreground"
              >
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              {field.type === "select" ? (
                <Select
                  value={value}
                  onValueChange={(next) => setField(field.key, next)}
                >
                  <SelectTrigger
                    id={fieldId}
                    data-ocid={`record.form.${field.key}.select`}
                  >
                    <SelectValue placeholder={field.placeholder ?? "请选择"} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "textarea" ? (
                <Textarea
                  id={fieldId}
                  data-ocid={`record.form.${field.key}.textarea`}
                  value={value}
                  placeholder={field.placeholder}
                  aria-invalid={invalid}
                  onChange={(e) => setField(field.key, e.target.value)}
                />
              ) : (
                <Input
                  id={fieldId}
                  data-ocid={`record.form.${field.key}.input`}
                  type={field.type === "date" ? "date" : "text"}
                  inputMode={field.type === "amount" ? "decimal" : undefined}
                  value={value}
                  placeholder={
                    field.type === "idNumber" && maskedIdNumber
                      ? maskIdNumber(maskedIdNumber)
                      : field.placeholder
                  }
                  aria-invalid={invalid}
                  onChange={(e) => setField(field.key, e.target.value)}
                />
              )}
              {field.help && (
                <p className="text-xs text-muted-foreground">{field.help}</p>
              )}
              {invalid && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="record.form.error"
                >
                  请填写{field.label}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="record-remarks"
          className="text-xs text-muted-foreground"
        >
          备注
        </Label>
        <Textarea
          id="record-remarks"
          data-ocid="record.form.remarks.textarea"
          value={remarks}
          placeholder="补充说明（可选）"
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>

      {error && (
        <div
          role="alert"
          data-ocid="record.form.error_state"
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
            data-ocid="record.form.cancel_button"
            onClick={onCancel}
            disabled={pending}
          >
            取消
          </Button>
        )}
        <Button
          type="submit"
          data-ocid="record.form.submit_button"
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

export { buildRecordData };
export type { FormValues };
export { describeError };
