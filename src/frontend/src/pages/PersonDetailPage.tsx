import { RecordKind } from "@/backend";
import type { RecordView } from "@/backend";
import { PageHeader } from "@/components/common/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/common/States";
import { IdNumberField } from "@/components/personnel/IdNumberField";
import { PersonRecordFormDialog } from "@/components/personnel/PersonRecordFormDialog";
import { PersonRecordList } from "@/components/personnel/PersonRecordList";
import { useMyAccess } from "@/components/personnel/usePersonnel";
import { RecordDetailSheet } from "@/components/records/RecordDetailSheet";
import { RecordBadges } from "@/components/records/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompanies } from "@/hooks/useCompanies";
import { useRecord } from "@/hooks/useRecordMutations";
import { useRecords } from "@/hooks/useRecords";
import { describeError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Building2, Pencil, Phone, UserRound } from "lucide-react";
import { useState } from "react";

type ChildKind = RecordKind.personCert | RecordKind.personTrack;

type FormState =
  | { mode: "create"; kind: ChildKind }
  | {
      mode: "edit";
      kind: RecordKind.person | ChildKind;
      record: RecordView;
    }
  | null;

export default function PersonDetailPage() {
  const { personId } = useParams({ from: "/personnel/$personId" });
  const id = BigInt(personId);

  const person = useRecord(id);
  const companies = useCompanies();
  const { accessFor } = useMyAccess();

  const [form, setForm] = useState<FormState>(null);
  const [detail, setDetail] = useState<RecordView | null>(null);

  const companyId = person.data?.companyId;
  const access = companyId !== undefined ? accessFor(companyId) : null;
  const company = companies.data?.find((c) => c.id === companyId);

  const certs = useRecords({ kind: RecordKind.personCert, personId: id });
  const tracks = useRecords({ kind: RecordKind.personTrack, personId: id });

  if (person.isLoading) {
    return (
      <div data-ocid="person_detail.page">
        <LoadingState rows={3} label="正在加载人员档案…" />
      </div>
    );
  }

  if (person.isError || !person.data) {
    return (
      <div data-ocid="person_detail.page" className="space-y-4">
        <BackLink />
        <ErrorState
          message={
            person.isError
              ? describeError(person.error)
              : "未找到该人员档案，或您没有查看权限。"
          }
          onRetry={() => void person.refetch()}
        />
      </div>
    );
  }

  const record = person.data;
  const data = record.data.__kind__ === "person" ? record.data.person : null;
  const canEdit = access?.canEdit ?? false;
  const canVerify = access?.canVerify ?? false;
  const canSensitive = access?.canSensitiveDownload ?? false;

  const openCreate = (kind: ChildKind) => setForm({ mode: "create", kind });

  return (
    <div data-ocid="person_detail.page" className="space-y-5">
      <BackLink />

      <PageHeader
        title={data?.name || record.title}
        description={company ? `归属单位：${company.name}` : record.companyName}
        actions={
          canEdit ? (
            <Button
              type="button"
              variant="outline"
              data-ocid="person.edit_button"
              onClick={() =>
                setForm({ mode: "edit", kind: RecordKind.person, record })
              }
            >
              <Pencil className="size-4" aria-hidden="true" />
              编辑人员
            </Button>
          ) : undefined
        }
      />

      <section
        data-ocid="person.profile.card"
        className="rounded-lg border border-border bg-card p-4 shadow-subtle md:p-5"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {data?.name || record.title}
                </h2>
                <RecordBadges
                  status={record.status}
                  expiryFlag={record.expiryFlag}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {data?.position || "未填写岗位"}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3" aria-hidden="true" />
                  {record.companyName}
                </span>
                {data?.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3" aria-hidden="true" />
                    {data.phone}
                  </span>
                )}
                <span>维护责任人 {record.maintainerName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
          <IdNumberField person={record} canSensitiveDownload={canSensitive} />
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">最后修改</p>
            <p className="text-sm text-foreground">
              {record.lastModifiedByName} ·{" "}
              {formatDateTime(record.lastModifiedAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              版本 {record.version.toString()}
            </p>
          </div>
        </div>
      </section>

      <Tabs defaultValue="certs" data-ocid="person.tabs">
        <TabsList>
          <TabsTrigger value="certs" data-ocid="person.tab.certs">
            人员证书
          </TabsTrigger>
          <TabsTrigger value="tracks" data-ocid="person.tab.tracks">
            人员业绩
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certs" className="pt-3">
          {certs.isLoading ? (
            <LoadingState rows={2} label="正在加载证书…" />
          ) : certs.isError ? (
            <ErrorState
              message={describeError(certs.error)}
              onRetry={() => void certs.refetch()}
            />
          ) : (
            <PersonRecordList
              records={certs.data ?? []}
              canEdit={canEdit}
              addLabel="新增证书"
              emptyTitle="暂无人员证书"
              emptyDescription="登记该人员的执业资格证书，便于到期跟踪与核实。"
              onAdd={() => openCreate(RecordKind.personCert)}
              onOpen={setDetail}
            />
          )}
        </TabsContent>

        <TabsContent value="tracks" className="pt-3">
          {tracks.isLoading ? (
            <LoadingState rows={2} label="正在加载业绩…" />
          ) : tracks.isError ? (
            <ErrorState
              message={describeError(tracks.error)}
              onRetry={() => void tracks.refetch()}
            />
          ) : (
            <PersonRecordList
              records={tracks.data ?? []}
              canEdit={canEdit}
              addLabel="新增业绩"
              emptyTitle="暂无人员业绩"
              emptyDescription="登记该人员参与的项目业绩，作为投标业绩证明。"
              onAdd={() => openCreate(RecordKind.personTrack)}
              onOpen={setDetail}
            />
          )}
        </TabsContent>
      </Tabs>

      {!canEdit && (
        <EmptyState
          title="只读访问"
          description="您对该单位没有「编辑」权限，无法新增或修改人员档案。"
          className="border-0 bg-transparent py-4"
        />
      )}

      <RecordDetailSheet
        record={detail}
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        canEdit={canEdit}
        canVerify={canVerify}
        canSensitiveDownload={canSensitive}
        onEdit={(target) => {
          setDetail(null);
          if (
            target.kind === RecordKind.personCert ||
            target.kind === RecordKind.personTrack
          ) {
            setForm({ mode: "edit", kind: target.kind, record: target });
          }
        }}
      />

      {form && companyId !== undefined && (
        <PersonRecordFormDialog
          kind={form.kind}
          personId={id}
          companyId={companyId}
          record={form.mode === "edit" ? form.record : null}
          open
          onOpenChange={(open) => {
            if (!open) setForm(null);
          }}
        />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/personnel"
      data-ocid="person.back_link"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-smooth hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      返回人员档案
    </Link>
  );
}
