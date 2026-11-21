import Map "mo:core/Map";
import List "mo:core/List";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "common";
import Accounts "accounts";
import Companies "companies";
import Attachments "attachments";
import Records "records";
import Audit "audit";
import Notifications "notifications";
import Opportunities "opportunities";

module {
  public type Counters = {
    var nextCompanyId : Nat;
    var nextRecordId : Nat;
    var nextAttachmentId : Nat;
    var nextHistoryId : Nat;
    var nextAuditId : Nat;
    var nextNotificationId : Nat;
    var nextOpportunityId : Nat;
    var nextCheckItemId : Nat;
    var nextStatusChangeId : Nat;
    var sampleSeeded : Bool;
  };

  /// References to the actor's persistent collections, built once in main.mo and shared by every mixin.
  public type State = {
    accessControlState : AccessControl.AccessControlState;
    accounts : Map.Map<Principal, Accounts.Account>;
    /// user -> company id -> permissions
    permissions : Map.Map<Principal, Map.Map<Common.CompanyId, Common.PermissionSet>>;
    companies : Map.Map<Common.CompanyId, Companies.Company>;
    records : Map.Map<Common.RecordId, Records.ArchiveRecord>;
    attachments : Map.Map<Common.AttachmentId, Attachments.Attachment>;
    history : List.List<Records.ChangeEntry>;
    auditLog : List.List<Audit.AuditEntry>;
    notifications : Map.Map<Common.NotificationId, Notifications.Notification>;
    opportunities : Map.Map<Common.OpportunityId, Opportunities.Opportunity>;
    checkItems : Map.Map<Common.CheckItemId, Opportunities.CheckItem>;
    statusChanges : List.List<Opportunities.StatusChange>;
    counters : Counters;
  };
};
