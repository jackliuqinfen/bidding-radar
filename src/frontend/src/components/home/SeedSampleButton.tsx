import { Button } from "@/components/ui/button";
import { useSeedSampleData } from "@/hooks/useAccountMutations";
import { describeError } from "@/lib/errors";
import { DatabaseZap, Loader2 } from "lucide-react";
import { toast } from "sonner";

/** 管理员 action: idempotently generate 【虚构】 sample companies and records. */
export function SeedSampleButton() {
  const seed = useSeedSampleData();

  const handleSeed = () => {
    seed.mutate(undefined, {
      onSuccess: (report) => {
        if (report.alreadySeeded) {
          toast.info("示例数据已存在，无需重复生成。");
          return;
        }
        toast.success(
          `已生成示例数据：${report.companies.toString()} 家公司、${report.records.toString()} 条档案、${report.attachments.toString()} 个附件。`,
        );
      },
      onError: (error) => {
        toast.error(describeError(error));
      },
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-ocid="home.seed_sample_button"
      onClick={handleSeed}
      disabled={seed.isPending}
    >
      {seed.isPending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <DatabaseZap className="size-3.5" aria-hidden="true" />
      )}
      {seed.isPending ? "正在生成…" : "生成示例数据"}
    </Button>
  );
}
