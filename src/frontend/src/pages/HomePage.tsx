import { AccountRole, type RecordView } from "@/backend";
import { PageHeader } from "@/components/common/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/common/States";
import { GapOverview } from "@/components/home/GapOverview";
import { HomeSection } from "@/components/home/HomeSection";
import { MyAttention } from "@/components/home/MyAttention";
import { PendingAccountList } from "@/components/home/PendingAccountList";
import { PermittedCompanies } from "@/components/home/PermittedCompanies";
import { SeedSampleButton } from "@/components/home/SeedSampleButton";
import { VerifyQueue } from "@/components/home/VerifyQueue";
import { RecordDetailSheet } from "@/components/records/RecordDetailSheet";
import { Button } from "@/components/ui/button";
import { useMyAccount } from "@/hooks/useAccount";
import { useHomeSummary } from "@/hooks/useDashboard";
import { useMyPermissions } from "@/hooks/usePermissions";
import { dashboardSearch } from "@/lib/dashboardSearch";
import { describeError } from "@/lib/errors";
import { APP_TAGLINE, ROLE_LABELS } from "@/lib/labels";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";

export default function HomePage() {
  const summary = useHomeSummary();
  const account = useMyAccount();
  const permissions = useMyPermissions();
  const [selected, setSelected] = useState<RecordView | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openRecord = (record: RecordView) => {
    setSelected(record);
    setSheetOpen(true);
  };

  const role = summary.data?.role ?? account.data?.role;
  const isAdmin = role === AccountRole.admin;
  const canVerify =
    permissions.data?.some((g) => g.permissions.verify) ?? false;

  const pendingAccounts = summary.data?.pendingAccounts ?? [];
  const overview = summary.data?.overview ?? [];
  const myAttention = summary.data?.myAttention ?? [];
  const toVerify = summary.data?.toVerify ?? [];

  const isEmptySystem =
    !!summary.data &&
    overview.length === 0 &&
    myAttention.length === 0 &&
    toVerify.length === 0 &&
    pendingAccounts.length === 0;

  const roleLabel = role ? ROLE_LABELS[role] : undefined;

  return (
    <div data-ocid="home.page" className="space-y-5">
      <PageHeader
        title="首页"
        description={
          roleLabel ? `${roleLabel}工作台 · ${APP_TAGLINE}` : APP_TAGLINE
        }
        actions={isAdmin ? <SeedSampleButton /> : undefined}
      />

      {summary.isLoading && <LoadingState rows={3} />}

      {summary.isError && (
        <ErrorState
          message={describeError(summary.error)}
          onRetry={() => void summary.refetch()}
        />
      )}

      {summary.data && isEmptySystem && (
        <EmptyState
          icon={<LayoutDashboard className="size-5" aria-hidden="true" />}
          title="系统还没有任何档案"
          description={
            isAdmin
              ? "先新建公司并录入证照、人员与业绩档案，或一键生成【虚构】示例数据快速体验。"
              : "管理员尚未录入公司档案。您可以先浏览公司列表，或等待管理员开通权限。"
          }
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button asChild type="button" size="sm">
                <Link to="/companies">前往公司档案</Link>
              </Button>
              {isAdmin && <SeedSampleButton />}
            </div>
          }
        />
      )}

      {summary.data && !isEmptySystem && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {isAdmin && (
            <HomeSection
              title="待批准用户"
              description="新注册的成员需管理员批准后才能使用系统。"
              icon={UserCheck}
              count={pendingAccounts.length}
              ocid="home.pending_users.section"
              action={
                <Button asChild type="button" variant="ghost" size="sm">
                  <Link to="/users">用户管理</Link>
                </Button>
              }
            >
              {pendingAccounts.length === 0 ? (
                <EmptyState
                  icon={<Users className="size-5" aria-hidden="true" />}
                  title="暂无待批准用户"
                  description="有新的注册申请时会出现在这里。"
                  className="border-0 bg-transparent py-8"
                />
              ) : (
                <PendingAccountList accounts={pendingAccounts} />
              )}
            </HomeSection>
          )}

          {isAdmin && (
            <HomeSection
              title="公司缺口总览"
              description="各公司档案的待补、待核、已核实与到期情况。"
              icon={LayoutDashboard}
              ocid="home.overview.section"
              action={
                <Button asChild type="button" variant="ghost" size="sm">
                  <Link
                    to="/dashboard"
                    search={(prev) => ({
                      status: prev.status,
                      expiry: prev.expiry,
                      category: prev.category,
                      owner: prev.owner,
                      company: prev.company,
                    })}
                  >
                    缺口看板
                  </Link>
                </Button>
              }
            >
              {overview.length === 0 ? (
                <EmptyState
                  icon={<Building2 className="size-5" aria-hidden="true" />}
                  title="暂无公司数据"
                  description="新建公司后即可查看缺口总览。"
                  className="border-0 bg-transparent py-8"
                />
              ) : (
                <GapOverview rows={overview} />
              )}
            </HomeSection>
          )}

          {!isAdmin && (
            <HomeSection
              title="我的待办"
              description="您负责的档案中待补、临近到期与已过期的部分。"
              icon={ClipboardCheck}
              count={myAttention.length}
              ocid="home.attention.section"
              action={
                <Button asChild type="button" variant="ghost" size="sm">
                  <Link
                    to="/dashboard"
                    search={(prev) => ({
                      status: prev.status,
                      expiry: prev.expiry,
                      category: prev.category,
                      owner: prev.owner,
                      company: prev.company,
                    })}
                  >
                    缺口看板
                  </Link>
                </Button>
              }
            >
              <MyAttention records={myAttention} onOpen={openRecord} />
            </HomeSection>
          )}

          {canVerify && (
            <HomeSection
              title="待核队列"
              description="您有核实权限的档案，核实后状态变为已核实。"
              icon={ClipboardCheck}
              count={toVerify.length}
              ocid="home.verify.section"
            >
              <VerifyQueue records={toVerify} onOpen={openRecord} />
            </HomeSection>
          )}

          {!isAdmin && !canVerify && (
            <HomeSection
              title="可查看的公司档案"
              description="您被授予查看权限的公司档案。"
              icon={Building2}
              ocid="home.permitted.section"
              action={
                <Button asChild type="button" variant="ghost" size="sm">
                  <Link to="/companies">全部公司</Link>
                </Button>
              }
            >
              <PermittedCompanies records={myAttention} onOpen={openRecord} />
            </HomeSection>
          )}
        </div>
      )}

      <RecordDetailSheet
        record={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        canEdit={false}
        canVerify={canVerify}
        canSensitiveDownload={false}
      />
    </div>
  );
}
