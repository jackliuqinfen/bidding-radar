import Map "mo:core/Map";
import List "mo:core/List";
import _Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import _RecordValue "mo:caffeineai-oql/RecordValue";
import _NatValue "mo:caffeineai-oql/NatValue";
import _IntValue "mo:caffeineai-oql/IntValue";
import _TextValue "mo:caffeineai-oql/TextValue";
import _PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import _BoolValue "mo:caffeineai-oql/BoolValue";
import Common "types/common";
import Accounts "types/accounts";
import Companies "types/companies";
import Attachments "types/attachments";
import Records "types/records";
import Audit "types/audit";
import Notifications "types/notifications";
import Opportunities "types/opportunities";
import State "types/state";
import AccountsApi "mixins/accounts-api";
import PermissionsApi "mixins/permissions-api";
import CompaniesApi "mixins/companies-api";
import RecordsApi "mixins/records-api";
import AttachmentsApi "mixins/attachments-api";
import AuditApi "mixins/audit-api";
import NotificationsApi "mixins/notifications-api";
import DashboardApi "mixins/dashboard-api";
import OpportunitiesApi "mixins/opportunities-api";
import SampleApi "mixins/sample-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);
  include MixinObjectStorage();

  let accounts : Map.Map<Principal, Accounts.Account>;
  let permissions : Map.Map<Principal, Map.Map<Common.CompanyId, Common.PermissionSet>>;
  let companies : Map.Map<Common.CompanyId, Companies.Company>;
  let records : Map.Map<Common.RecordId, Records.ArchiveRecord>;
  let attachments : Map.Map<Common.AttachmentId, Attachments.Attachment>;
  let history : List.List<Records.ChangeEntry>;
  let auditLog : List.List<Audit.AuditEntry>;
  let notifications : Map.Map<Common.NotificationId, Notifications.Notification>;
  let opportunities : Map.Map<Common.OpportunityId, Opportunities.Opportunity>;
  let checkItems : Map.Map<Common.CheckItemId, Opportunities.CheckItem>;
  let statusChanges : List.List<Opportunities.StatusChange>;
  let counters : State.Counters;

  transient let state : State.State = {
    accessControlState;
    accounts;
    permissions;
    companies;
    records;
    attachments;
    history;
    auditLog;
    notifications;
    opportunities;
    checkItems;
    statusChanges;
    counters;
  };

  // ── OQL entities ───────────────────────────────────────────────────────────
  // Every persisted, queryable collection is exposed. Rows are read only by
  // controllers (the Data Intelligence agent) because the app's own reads are
  // permission-gated update calls; the person ID number is hidden from OQL.

  transient let anyPrincipal = Principal.fromText("aaaaa-aa");

  include Expose({
    entities = [
      companies.toEntityManual("company", "Company", "id")
        .sample({
          id = 0;
          name = "";
          creditCode = "";
          registeredPlace = "";
          contact = "";
          maintainer = anyPrincipal;
          createdAt = 0;
          createdBy = anyPrincipal;
          updatedAt = 0;
          updatedBy = anyPrincipal;
        })
        .controllerOnly()
        .build(),
      records.toEntityManual("record", "Record", "id")
        .sample({
          id = 0;
          companyId = 0;
          data = #license({
            category = "";
            name = "";
            number = "";
            issuingAuthority = "";
            validFrom = ?0;
            validTo = ?0;
          });
          maintainer = anyPrincipal;
          remarks = "";
          version = 0;
          verification = ?{ verifier = anyPrincipal; verifiedAt = 0 };
          createdBy = anyPrincipal;
          createdAt = 0;
          lastModifiedBy = anyPrincipal;
          lastModifiedAt = 0;
        })
        .controllerOnly()
        .build(),
      attachments.toEntityManual("attachment", "Attachment", "id")
        .sample({
          id = 0;
          recordId = 0;
          companyId = 0;
          sensitive = false;
          createdAt = 0;
          versions = [];
        })
        .controllerOnly()
        .build(),
      auditLog.toEntityManual("auditEntry", "AuditEntry", "id")
        .sample({
          id = 0;
          operator = anyPrincipal;
          at = 0;
          action = #signIn;
          target = "";
          companyId = ?0;
          result = #success;
          denialReason = ?"";
        })
        .controllerOnly()
        .build(),
      notifications.toEntityManual("notification", "Notification", "id")
        .sample({
          id = 0;
          recipient = anyPrincipal;
          kind = #pendingUser;
          message = "";
          companyId = ?0;
          recordId = ?0;
          opportunityId = ?0;
          createdAt = 0;
          read = false;
          dedupKey = ?"";
        })
        .controllerOnly()
        .build(),
      accounts.toEntityManual("account", "Account", "principal")
        .sample({
          principal = anyPrincipal;
          displayName = "";
          approval = #pending;
          registeredAt = 0;
          decidedAt = ?0;
          decidedBy = ?anyPrincipal;
        })
        .controllerOnly()
        .build(),
      opportunities.toEntityManual("opportunity", "Opportunity", "id")
        .sample({
          id = 0;
          projectName = "";
          tenderer = "";
          projectType = #construction;
          sourceName = "";
          sourceUrl = "";
          publishDate = 0;
          registrationDeadline = 0;
          bidOpenTime = 0;
          budgetYuan = ?0;
          body = "";
          clauses = [];
          status = #pendingReview;
          draft = false;
          createdBy = anyPrincipal;
          createdAt = 0;
          lastModifiedBy = anyPrincipal;
          lastModifiedAt = 0;
        })
        .controllerOnly()
        .build(),
      checkItems.toEntityManual("checkItem", "CheckItem", "id")
        .sample({
          id = 0;
          opportunityId = 0;
          companyId = 0;
          kind = #qualification;
          clauseExcerpt = "";
          conclusion = #pending;
          basis = "";
          evidence = [];
          createdBy = anyPrincipal;
          createdAt = 0;
          lastModifiedBy = anyPrincipal;
          lastModifiedAt = 0;
          confirmation = null;
        })
        .controllerOnly()
        .build(),
    ];
  });

  include AccountsApi(state);
  include PermissionsApi(state);
  include CompaniesApi(state);
  include RecordsApi(state);
  include AttachmentsApi(state);
  include AuditApi(state);
  include NotificationsApi(state);
  include DashboardApi(state);
  include OpportunitiesApi(state);
  include SampleApi(state);
  include ApiDocMixin();
};
