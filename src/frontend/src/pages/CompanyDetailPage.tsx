import type { RecordFilter, RecordKind, RecordView } from "@/backend";
import { RecordKind as RecordKindEnum } from "@/backend";
import { PageHeader } from "@/components/common/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/common/States";
import { RecordEditorDialog } from "@/components/companies/RecordEditorDialog";
import { RecordList } from "@/components/companies/RecordList";
import { RecordDetailSheet } from "@/components/records/RecordDetailSheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyAccount } from "@/hooks/useAccount";
import { useCompanyDetail } from "@/hooks/useCompanyDetail";
import { useMyPermissions } from "@/hooks/usePermissions";
import { describeError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { KIND_LABELS } from "@/lib/labels";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Building2,
  ChevronLeft,
  Lock,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

const TABS: { kind: RecordKind; value: string }[] = [
  { kind: RecordKindEnum.license, value: "license" },
  { kind: RecordKindEnum.companyTrack, value: "companyTrack" },
];

function ProfileField({
  icon,
  label,
  value,
  mono,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={
            mono
              ? "truncate font-mono text-sm text-foreground"
              : "truncate text-sm text-foreground"
          }
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default function CompanyDetailPage() {
  const params = useParams({ from: "/companies/$companyId" });
  const navigate = useNavigate();
  const account = useMyAccount();
  const permissions = useMyPermissions();

  const companyId = useMemo(() => {
    try {
      return BigInt(params.companyId);
    } catch {
      return null;
    }
  }, [params.companyId]);

  const filter = useMemo<RecordFilter>(
    () => (companyId !== null ? { companyId } : {}),
    [companyId],
  );

  const detail = useCompanyDetail(companyId ?? 0n, filter);

  const [activeTab, setActiveTab] = useState<string>("license");
  const [sheetRecord, setSheetRecord] = useState<RecordView | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKind, setEditorKind] = useState<RecordKind>(
    RecordKindEnum.license,
  );
  const [editingRecord, setEditingRecord] = useState<RecordView | undefined>(
    undefined,
  );

  const isAdmin = account.data?.role === "admin";
  const grant = useMemo(
    () =>
      (permissions.data ?? []).find(
        (g) => companyId !== null && g.companyId === companyId,
      ),
    [permissions.data, companyId],
  );
  const canEdit = isAdmin || !!grant?.permissions.edit;
  const canVerify = isAdmin || !!grant?.permissions.verify;
  const canSensitiveDownload =
    isAdmin || !!grant?.permissions.sensitiveDownload;

  const recordsByKind = useMemo(() => {
    const map = new Map<RecordKind, RecordView[]>();
    for (const record of detail.data?.records ?? []) {
      const list = map.get(record.kind) ?? [];
      list.push(record);
      map.set(record.kind, list);
    }
    return map;
  }, [detail.data]);

  const activeKind =
    activeTab === "companyTrack"
      ? RecordKindEnum.companyTrack
      : RecordKindEnum.license;

  const openCreate = (kind: RecordKind) => {
    setEditingRecord(undefined);
    setEditorKind(kind);
    setEditorOpen(true);
  };

  const openEdit = (record: RecordView) => {
    setSheetOpen(false);
    setEditingRecord(record);
    setEditorKind(record.kind);
    setEditorOpen(true);
  };

  const openSheet = (record: RecordView) => {
    setSheetRecord(record);
    setSheetOpen(true);
  };

  const backLink = (
    <button
      type="button"
      data-ocid="company_detail.back_button"
      onClick={() => void navigate({ to: "/companies" })}
      className="inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground transition-smooth hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronLeft className="size-3.5" aria-hidden="true" />
      公司档案
    </button>
  );

  if (companyId === null) {
    return (
      <div data-ocid="company_detail.page">
        <PageHeader title="公司详情" breadcrumb={backLink} />
        <ErrorState message="公司编号无效，请返回公司档案重新选择。" />
      </div>
    );
  }

  if (detail.isLoading) {
    return (
      <div data-ocid="company_detail.page">
        <PageHeader title="公司详情" breadcrumb={backLink} />
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 shadow-subtle">
            <Skeleton className="mb-3 h-5 w-1/3" />
            <Skeleton className="mb-2 h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <LoadingState rows={2} label="正在加载档案…" />
        </div>
      </div>
    );
  }

  if (detail.isError) {
    return (
      <div data-ocid="company_detail.page">
        <PageHeader title="公司详情" breadcrumb={backLink} />
        <ErrorState
          message={describeError(detail.error)}
          onRetry={() => void detail.refetch()}
        />
      </div>
    );
  }

  const data = detail.data;
  if (!data) {
    return (
      <div data-ocid="company_detail.page">
        <PageHeader title="公司详情" breadcrumb={backLink} />
        <ErrorState message="未找到该公司。" />
      </div>
    );
  }

  if (!data.canView || !data.company) {
    return (
      <div data-ocid="company_detail.page">
        <PageHeader
          title={data.companyName || "公司详情"}
          breadcrumb={backLink}
        />
        <EmptyState
          title="无权查看该公司档案"
          description="您没有该公司的「查看」权限，档案内容已隐藏。如需访问，请联系管理员开通权限。"
          icon={<Lock className="size-5" aria-hidden="true" />}
        />
      </div>
    );
  }

  const company = data.company;
  const counts = data.counts;

  return (
    <div data-ocid="company_detail.page">
      <PageHeader
        title={company.name}
        breadcrumb={backLink}
        description={`统一社会信用代码 ${company.creditCode}`}
      />

      <section
        data-ocid="company_detail.profile"
        className="mb-5 rounded-lg border border-border bg-card p-5 shadow-subtle"
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Building2 className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-semibold text-foreground">
              {company.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              登记于 {formatDate(company.createdAt)}
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileField
            icon={<ShieldCheck className="size-4" aria-hidden="true" />}
            label="统一社会信用代码"
            value={company.creditCode}
            mono
          />
          <ProfileField
            icon={<MapPin className="size-4" aria-hidden="true" />}
            label="注册地"
            value={company.registeredPlace}
          />
          <ProfileField
            icon={<Phone className="size-4" aria-hidden="true" />}
            label="联系方式"
            value={company.contact}
          />
          <ProfileField
            icon={<UserRound className="size-4" aria-hidden="true" />}
            label="维护责任人"
            value={company.maintainerName}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="rounded-sm bg-status-missing-soft px-2 py-0.5 text-status-missing-foreground">
            待补 {counts.missing.toString()}
          </span>
          <span className="rounded-sm bg-status-pending-soft px-2 py-0.5 text-status-pending-foreground">
            待核 {counts.pendingReview.toString()}
          </span>
          <span className="rounded-sm bg-status-verified-soft px-2 py-0.5 text-status-verified-foreground">
            已核实 {counts.verified.toString()}
          </span>
          <span className="rounded-sm bg-status-expiring-soft px-2 py-0.5 text-status-expiring-foreground">
            临近到期 {counts.nearExpiry.toString()}
          </span>
          <span className="rounded-sm bg-status-expired-soft px-2 py-0.5 text-status-expired-foreground">
            已过期 {counts.expired.toString()}
          </span>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList data-ocid="company_detail.tabs">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                data-ocid={`company_detail.tab.${tab.value}`}
                className="px-4"
              >
                {KIND_LABELS[tab.kind]}
                <span className="ml-1 text-xs text-muted-foreground">
                  {(recordsByKind.get(tab.kind) ?? []).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          {canEdit && (
            <Button
              type="button"
              size="sm"
              data-ocid="company_detail.create_record_button"
              onClick={() => openCreate(activeKind)}
            >
              <Plus className="size-4" aria-hidden="true" />
              新建{KIND_LABELS[activeKind]}
            </Button>
          )}
        </div>

        {TABS.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="mt-3"
            data-ocid={`company_detail.panel.${tab.value}`}
          >
            <RecordList
              records={recordsByKind.get(tab.kind) ?? []}
              canEdit={canEdit}
              onOpen={openSheet}
              onCreate={() => openCreate(tab.kind)}
            />
          </TabsContent>
        ))}
      </Tabs>

      <RecordDetailSheet
        record={sheetRecord}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        canEdit={canEdit}
        canVerify={canVerify}
        canSensitiveDownload={canSensitiveDownload}
        onEdit={openEdit}
      />

      {canEdit && account.data && (
        <RecordEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          kind={editorKind}
          companyId={companyId}
          maintainer={account.data.principal.toText()}
          record={editingRecord}
        />
      )}
    </div>
  );
}
