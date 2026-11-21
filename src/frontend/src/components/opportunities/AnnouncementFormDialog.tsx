import type { ProjectType } from "@/backend";
import { ProjectType as ProjectTypeEnum } from "@/backend";
import {
  type AnnouncementFieldIssue,
  type AnnouncementFormValues,
  emptyAnnouncementValues,
  toOpportunityInput,
  validateAnnouncement,
} from "@/components/opportunities/announcementForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  useCreateOpportunityDraft,
  useSubmitOpportunity,
} from "@/hooks/useOpportunityMutations";
import { describeError } from "@/lib/errors";
import { PROJECT_TYPE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

const PROJECT_TYPE_OPTIONS = Object.values(ProjectTypeEnum);

type FieldKey = keyof AnnouncementFormValues;

interface TextField {
  key: FieldKey;
  label: string;
  placeholder: string;
  type?: "text" | "url" | "date" | "number";
  required?: boolean;
  help?: string;
  span?: boolean;
}

const TEXT_FIELDS: TextField[] = [
  {
    key: "projectName",
    label: "项目名称",
    placeholder: "如：滨江新区综合管廊工程施工",
    required: true,
    span: true,
  },
  {
    key: "tenderer",
    label: "招标人",
    placeholder: "如：滨江市城市建设投资有限公司",
    required: true,
  },
  {
    key: "sourceName",
    label: "公告来源",
    placeholder: "如：中国招标投标公共服务平台",
    required: true,
  },
  {
    key: "sourceUrl",
    label: "公告链接",
    placeholder: "https://…",
    type: "url",
    required: true,
    span: true,
  },
  {
    key: "publishDate",
    label: "公告发布日期",
    placeholder: "",
    type: "date",
    required: true,
  },
  {
    key: "registrationDeadline",
    label: "报名截止时间",
    placeholder: "",
    type: "date",
    required: true,
  },
  {
    key: "bidOpenTime",
    label: "开标时间",
    placeholder: "",
    type: "date",
    required: true,
  },
  {
    key: "budgetYuan",
    label: "预算金额（元）",
    placeholder: "如：12800000",
    type: "number",
    help: "可留空；填写时按元计，保留两位小数",
  },
];

/**
 * Records one tender announcement. The draft lives in local state so a failed
 * save keeps every typed value; the dialog only closes after success.
 */
export function AnnouncementFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createDraft = useCreateOpportunityDraft();
  const submitOpportunity = useSubmitOpportunity();
  const [values, setValues] = useState<AnnouncementFormValues>(
    emptyAnnouncementValues,
  );
  const [issues, setIssues] = useState<AnnouncementFieldIssue[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);

  const pending = createDraft.isPending || submitOpportunity.isPending;

  const setField = (key: FieldKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setIssues((prev) => prev.filter((issue) => issue.key !== key));
  };

  const issueFor = (key: FieldKey) =>
    issues.find((issue) => issue.key === key)?.message;

  const reset = () => {
    setValues(emptyAnnouncementValues());
    setIssues([]);
    setError(undefined);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setError(undefined);
      setIssues([]);
    }
    onOpenChange(next);
  };

  const save = (mode: "draft" | "submit") => {
    setError(undefined);
    const found = validateAnnouncement(values);
    if (found.length > 0) {
      setIssues(found);
      return;
    }
    let input: ReturnType<typeof toOpportunityInput>;
    try {
      input = toOpportunityInput(values);
    } catch (err) {
      setError(describeError(err));
      return;
    }
    createDraft.mutate(input, {
      onSuccess: (created) => {
        if (mode === "draft") {
          toast.success("公告已保存为草稿");
          reset();
          onOpenChange(false);
          return;
        }
        submitOpportunity.mutate(created.id, {
          onSuccess: () => {
            toast.success("公告已提交，进入机会池");
            reset();
            onOpenChange(false);
          },
          onError: (err) => {
            setError(
              `草稿已保存，但提交失败：${describeError(err)}。可在草稿中重试提交。`,
            );
          },
        });
      },
      onError: (err) => setError(describeError(err)),
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    save("submit");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="announcement.form.dialog"
        className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>录入招标公告</DialogTitle>
          <DialogDescription>
            公告正文与来源链接为必填。可先保存为草稿（仅本人可见可改），确认后提交进入机会池。
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          data-ocid="announcement.form"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {TEXT_FIELDS.map((field) => {
              const value = values[field.key];
              const message = issueFor(field.key);
              const fieldId = `announcement-field-${field.key}`;
              return (
                <div
                  key={field.key}
                  className={cn("space-y-1.5", field.span && "sm:col-span-2")}
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
                    type={field.type ?? "text"}
                    inputMode={field.type === "number" ? "decimal" : undefined}
                    min={field.type === "number" ? 0 : undefined}
                    step={field.type === "number" ? "0.01" : undefined}
                    value={value}
                    placeholder={field.placeholder}
                    aria-invalid={!!message}
                    aria-required={field.required}
                    autoComplete="off"
                    data-ocid={`announcement.form.${field.key}.input`}
                    onChange={(e) => setField(field.key, e.target.value)}
                  />
                  {message ? (
                    <p
                      className="text-xs text-destructive"
                      data-ocid={`announcement.form.${field.key}.error`}
                    >
                      {message}
                    </p>
                  ) : (
                    field.help && (
                      <p className="text-xs text-muted-foreground">
                        {field.help}
                      </p>
                    )
                  )}
                </div>
              );
            })}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                项目类型
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </Label>
              <Select
                value={values.projectType}
                onValueChange={(value) =>
                  setValues((prev) => ({
                    ...prev,
                    projectType: value as ProjectType,
                  }))
                }
              >
                <SelectTrigger
                  data-ocid="announcement.form.projectType.select"
                  aria-label="项目类型"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {PROJECT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="announcement-field-body"
              className="text-xs text-muted-foreground"
            >
              公告正文
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            </Label>
            <Textarea
              id="announcement-field-body"
              value={values.body}
              rows={8}
              placeholder="粘贴公告原文，保留段落与列表结构。"
              aria-invalid={!!issueFor("body")}
              aria-required
              data-ocid="announcement.form.body.textarea"
              className="min-h-40 resize-y font-body text-sm leading-relaxed"
              onChange={(e) => setField("body", e.target.value)}
            />
            {issueFor("body") ? (
              <p
                className="text-xs text-destructive"
                data-ocid="announcement.form.body.error"
              >
                {issueFor("body")}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                正文用于后续资格核对追溯，请完整保留原文段落。
              </p>
            )}
          </div>

          {issues.length > 0 && (
            <div
              role="alert"
              data-ocid="announcement.form.validation_state"
              className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-foreground"
            >
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <span>
                还有 {issues.length} 项需要补充：
                {issues.map((issue) => issue.label).join("、")}
              </span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              data-ocid="announcement.form.error_state"
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
            <Button
              type="button"
              variant="outline"
              data-ocid="announcement.form.cancel_button"
              onClick={() => handleOpenChange(false)}
              disabled={pending}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="secondary"
              data-ocid="announcement.form.save_draft_button"
              onClick={() => save("draft")}
              disabled={pending}
            >
              {createDraft.isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              保存草稿
            </Button>
            <Button
              type="submit"
              data-ocid="announcement.form.submit_button"
              disabled={pending}
            >
              {submitOpportunity.isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              提交到机会池
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
