import type {
  CheckConclusion,
  CheckItemKind,
  CheckItemUpdate,
  CheckItemView,
  RecordView,
} from "@/backend";
import { CheckConclusion as CheckConclusionEnum } from "@/backend";
import {
  EvidencePicker,
  type EvidenceSelection,
} from "@/components/opportunities/EvidencePicker";
import { CHECK_ITEM_KIND_OPTIONS } from "@/components/opportunities/opportunityConfig";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  useCreateCheckItem,
  useUpdateCheckItem,
} from "@/hooks/useOpportunityMutations";
import { describeError } from "@/lib/errors";
import { CHECK_CONCLUSION_LABELS, CHECK_CONCLUSION_ORDER } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CONCLUSION_STYLES: Record<CheckConclusion, string> = {
  [CheckConclusionEnum.conform]:
    "border-status-verified-border bg-status-verified-soft text-status-verified-foreground",
  [CheckConclusionEnum.nonConform]:
    "border-status-expired-border bg-status-expired-soft text-status-expired-foreground",
  [CheckConclusionEnum.pending]:
    "border-status-pending-border bg-status-pending-soft text-status-pending-foreground",
};

/**
 * Create/edit dialog for a single qualification check item. The conclusion is
 * forced to 待核 whenever a cited record is not 已核实, and 依据说明 is required.
 */
export function QualificationCheckForm({
  open,
  onOpenChange,
  opportunityId,
  companyId,
  companyName,
  records,
  canViewRecords,
  editing,
  defaultKind,
  defaultClause,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: bigint;
  companyId: bigint;
  companyName: string;
  records: RecordView[];
  canViewRecords: boolean;
  editing?: CheckItemView;
  defaultKind?: CheckItemKind;
  defaultClause?: string;
}) {
  const createItem = useCreateCheckItem();
  const updateItem = useUpdateCheckItem();

  const [kind, setKind] = useState<CheckItemKind>(
    editing?.kind ?? defaultKind ?? CHECK_ITEM_KIND_OPTIONS[0].value,
  );
  const [conclusion, setConclusion] = useState<CheckConclusion>(
    editing?.conclusion ?? CheckConclusionEnum.pending,
  );
  const [basis, setBasis] = useState(editing?.basis ?? "");
  const [clauseExcerpt, setClauseExcerpt] = useState(
    editing?.clauseExcerpt ?? defaultClause ?? "",
  );
  const [evidence, setEvidence] = useState<EvidenceSelection[]>(
    editing?.evidence.map((item) => ({
      recordId: item.recordId,
      statusAtCitation: item.statusAtCitation,
    })) ?? [],
  );
  const [error, setError] = useState<string | null>(null);

  const hasUnverifiedEvidence = evidence.some(
    (item) => item.statusAtCitation !== "verified",
  );
  const effectiveConclusion: CheckConclusion = hasUnverifiedEvidence
    ? CheckConclusionEnum.pending
    : conclusion;
  const basisMissing = basis.trim().length === 0;
  const pending = createItem.isPending || updateItem.isPending;

  const reset = () => {
    setKind(editing?.kind ?? defaultKind ?? CHECK_ITEM_KIND_OPTIONS[0].value);
    setConclusion(editing?.conclusion ?? CheckConclusionEnum.pending);
    setBasis(editing?.basis ?? "");
    setClauseExcerpt(editing?.clauseExcerpt ?? defaultClause ?? "");
    setEvidence(
      editing?.evidence.map((item) => ({
        recordId: item.recordId,
        statusAtCitation: item.statusAtCitation,
      })) ?? [],
    );
    setError(null);
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const submit = () => {
    if (basisMissing) {
      setError("请填写依据说明，并引用公告原文条款。");
      return;
    }
    const payload = {
      kind,
      conclusion: effectiveConclusion,
      basis: basis.trim(),
      clauseExcerpt: clauseExcerpt.trim(),
      evidence,
    };

    if (editing) {
      const change: CheckItemUpdate = payload;
      updateItem.mutate(
        { id: editing.id, change },
        {
          onSuccess: () => {
            toast.success("核对结论已更新");
            close();
          },
          onError: (err) => setError(describeError(err)),
        },
      );
      return;
    }

    createItem.mutate(
      { ...payload, opportunityId, companyId },
      {
        onSuccess: () => {
          toast.success("核对结论已保存");
          close();
        },
        onError: (err) => setError(describeError(err)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent
        data-ocid="check_form.dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>{editing ? "修改核对结论" : "发起资格核对"}</DialogTitle>
          <DialogDescription>
            {companyName} · 结论需可追溯到公告原文，依据说明必填。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="check-kind">核对项</Label>
            <Select
              value={kind}
              onValueChange={(value) => setKind(value as CheckItemKind)}
            >
              <SelectTrigger
                id="check-kind"
                data-ocid="check_form.kind.select"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHECK_ITEM_KIND_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>结论</Label>
            <div
              data-ocid="check_form.conclusion.group"
              className="flex flex-wrap gap-2"
            >
              {CHECK_CONCLUSION_ORDER.map((value) => {
                const active = effectiveConclusion === value;
                const blocked =
                  hasUnverifiedEvidence &&
                  value !== CheckConclusionEnum.pending;
                return (
                  <button
                    key={value}
                    type="button"
                    data-ocid={`check_form.conclusion.${value}`}
                    aria-pressed={active}
                    disabled={blocked}
                    title={
                      blocked
                        ? "引用了待补或待核档案，只能为「待核」"
                        : undefined
                    }
                    onClick={() => setConclusion(value)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? CONCLUSION_STYLES[value]
                        : "border-border bg-background text-muted-foreground hover:bg-accent/60",
                      blocked && "cursor-not-allowed opacity-50",
                    )}
                  >
                    {CHECK_CONCLUSION_LABELS[value]}
                  </button>
                );
              })}
            </div>
            {hasUnverifiedEvidence && (
              <p className="text-xs text-status-pending-foreground">
                引用了待补或待核档案，结论已锁定为「待核」。
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="check-clause">引用公告条款</Label>
            <Textarea
              id="check-clause"
              data-ocid="check_form.clause.textarea"
              value={clauseExcerpt}
              onChange={(event) => setClauseExcerpt(event.target.value)}
              placeholder="粘贴公告正文中对应的条款片段"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="check-basis">
              依据说明 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="check-basis"
              data-ocid="check_form.basis.textarea"
              value={basis}
              onChange={(event) => setBasis(event.target.value)}
              placeholder="说明判断依据，并对应到公告条款与公司档案。"
              rows={3}
              aria-invalid={error !== null}
            />
          </div>

          <div className="space-y-1.5">
            <Label>引用公司档案佐证</Label>
            <EvidencePicker
              records={records}
              canView={canViewRecords}
              selected={evidence}
              onChange={setEvidence}
              disabled={pending}
            />
          </div>

          {error && (
            <p
              data-ocid="check_form.error_state"
              role="alert"
              className="text-xs text-destructive"
            >
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            data-ocid="check_form.cancel_button"
            onClick={close}
          >
            取消
          </Button>
          <Button
            type="button"
            data-ocid="check_form.submit_button"
            disabled={basisMissing || pending}
            onClick={submit}
          >
            {pending && (
              <Loader2
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            {editing ? "保存修改" : "保存结论"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
