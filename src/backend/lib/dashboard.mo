import Map "mo:core/Map";
import Time "mo:core/Time";
import Common "../types/common";
import State "../types/state";
import Records "../types/records";
import Dashboard "../types/dashboard";
import Accounts "../types/accounts";
import Companies "../types/companies";
import Audit "../types/audit";
import Errors "../types/errors";
import Access "access";
import AuditLib "audit";
import RecordsLib "records";
import CompaniesLib "companies";
import NotificationsLib "notifications";

module {
  func _emptyCounts() : Dashboard.GapCounts {
    { missing = 0; pendingReview = 0; verified = 0; nearExpiry = 0; expired = 0 };
  };

  func countsFor(state : State.State, companyId : Common.CompanyId, now : Common.Timestamp) : Dashboard.GapCounts {
    var missing = 0;
    var pendingReview = 0;
    var verified = 0;
    var nearExpiry = 0;
    var expired = 0;
    for (record in state.records.values()) {
      if (record.companyId == companyId) {
        switch (RecordsLib.statusOf(record)) {
          case (#missing) missing += 1;
          case (#pendingReview) pendingReview += 1;
          case (#verified) verified += 1;
        };
        switch (RecordsLib.expiryOf(record, now)) {
          case (?#nearExpiry) nearExpiry += 1;
          case (?#expired) expired += 1;
          case null {};
        };
      };
    };
    { missing; pendingReview; verified; nearExpiry; expired };
  };

  /// One row per company (zeros when no records), counts only. Runs the expiry-notification check.
  public func gapRows(state : State.State, caller : Principal) : Errors.ApiResult<[Dashboard.CompanyGapRow]> {
    switch (Access.requireApproved(state, caller, #viewDashboard, "缺口看板", null)) {
      case (#err e) #err e;
      case (#ok _) {
        NotificationsLib.checkExpiry(state);
        let now = Time.now();
        let all = state.companies.values().toArray();
        let sorted = all.sort(func (a : Companies.Company, b : Companies.Company) : { #less; #equal; #greater } {
          if (a.name < b.name) #less else if (a.name > b.name) #greater else #equal;
        });
        AuditLib.log(state, caller, #viewDashboard, "缺口看板", null, #success, null);
        #ok(sorted.map(func (c : Companies.Company) : Dashboard.CompanyGapRow {
          {
            companyId = c.id;
            companyName = c.name;
            counts = countsFor(state, c.id, now);
            canView = Access.hasPermission(state, caller, c.id, #view);
          };
        }));
      };
    };
  };

  /// Per-company detail filtered by status, expiry flag, category and 维护责任人; counts only without 查看.
  /// filter.companyId is ignored in favour of companyId.
  public func companyDetail(state : State.State, caller : Principal, companyId : Common.CompanyId, filter : Records.RecordFilter) : Errors.ApiResult<Dashboard.CompanyDetail> {
    switch (Access.requireApproved(state, caller, #viewDashboard, "公司详情", ?companyId)) {
      case (#err e) #err e;
      case (#ok _) {
        switch (state.companies.get(companyId)) {
          case null {
            AuditLib.log(state, caller, #viewDashboard, "公司 #" # companyId.toText(), ?companyId, #denied, ?"公司不存在");
            return #err(#notFound("公司不存在"));
          };
          case (?company) {
            let now = Time.now();
            let canView = Access.hasPermission(state, caller, companyId, #view);
            let counts = countsFor(state, companyId, now);
            if (not canView) {
              AuditLib.log(state, caller, #viewDashboard, company.name, ?companyId, #success, null);
              return #ok({
                companyId;
                companyName = company.name;
                counts;
                canView = false;
                company = null;
                records = [];
              });
            };
            let scopedFilter : Records.RecordFilter = { filter with companyId = ?companyId };
            let all = state.records.values().toArray();
            let matched = all.filter(func (r : Records.ArchiveRecord) : Bool {
              r.companyId == companyId and matches(scopedFilter, r, now);
            });
            let sorted = matched.sort(func (a : Records.ArchiveRecord, b : Records.ArchiveRecord) : { #less; #equal; #greater } {
              if (a.id > b.id) #less else if (a.id < b.id) #greater else #equal;
            });
            AuditLib.log(state, caller, #viewDashboard, company.name, ?companyId, #success, null);
            #ok({
              companyId;
              companyName = company.name;
              counts;
              canView = true;
              company = ?CompaniesLib.toView(state, company);
              records = sorted.map(func (r : Records.ArchiveRecord) : Records.RecordView = RecordsLib.toView(state, caller, r));
            });
          };
        };
      };
    };
  };

  func matches(filter : Records.RecordFilter, record : Records.ArchiveRecord, now : Common.Timestamp) : Bool {
    let okStatus = switch (filter.status) {
      case (?s) RecordsLib.statusOf(record) == s;
      case null true;
    };
    let okExpiry = switch (filter.expiry) {
      case (?e) RecordsLib.expiryOf(record, now) == ?e;
      case null true;
    };
    let okCategory = switch (filter.category) {
      case (?cat) {
        let recordCategory = switch (record.data) {
          case (#license(d)) d.category;
          case (#personCert(d)) d.category;
          case _ "";
        };
        recordCategory == cat;
      };
      case null true;
    };
    let okMaintainer = switch (filter.maintainer) {
      case (?m) Principal.equal(record.maintainer, m);
      case null true;
    };
    let okKind = switch (filter.kind) {
      case (?k) RecordsLib.kindOf(record.data) == k;
      case null true;
    };
    okStatus and okExpiry and okCategory and okMaintainer and okKind;
  };

  /// Role home data. Runs the expiry-notification check.
  public func home(state : State.State, caller : Principal) : Errors.ApiResult<Dashboard.HomeSummary> {
    switch (Access.requireApproved(state, caller, #viewDashboard, "首页", null)) {
      case (#err e) #err e;
      case (#ok _) {
        NotificationsLib.checkExpiry(state);
        let now = Time.now();
        let isAdmin = Access.isAdmin(state, caller);
        let role : Accounts.AccountRole = if (isAdmin) #admin else #member;

        let pendingAccounts : [Accounts.AccountView] = if (isAdmin) {
          let pending = state.accounts.values().filter(func (a : Accounts.Account) : Bool {
            a.approval == #pending;
          }).toArray();
          let sorted = pending.sort(func (a : Accounts.Account, b : Accounts.Account) : { #less; #equal; #greater } {
            if (a.registeredAt < b.registeredAt) #less else if (a.registeredAt > b.registeredAt) #greater else #equal;
          });
          sorted.map(func (a : Accounts.Account) : Accounts.AccountView {
            {
              principal = a.principal;
              displayName = a.displayName;
              role = #member;
              roleLabel = "成员";
              approval = a.approval;
              approvalLabel = "待批准";
              registeredAt = a.registeredAt;
              decidedAt = a.decidedAt;
              decidedByName = null;
            };
          });
        } else {
          [];
        };

        let allCompanies = state.companies.values().toArray();
        let sortedCompanies = allCompanies.sort(func (a : Companies.Company, b : Companies.Company) : { #less; #equal; #greater } {
          if (a.name < b.name) #less else if (a.name > b.name) #greater else #equal;
        });
        let overview = sortedCompanies.filter(func (c : Companies.Company) : Bool {
          isAdmin or Access.hasPermission(state, caller, c.id, #view);
        }).map(func (c : Companies.Company) : Dashboard.CompanyGapRow {
          {
            companyId = c.id;
            companyName = c.name;
            counts = countsFor(state, c.id, now);
            canView = Access.hasPermission(state, caller, c.id, #view);
          };
        });

        let allRecords = state.records.values().toArray();
        let myAttention = allRecords.filter(func (r : Records.ArchiveRecord) : Bool {
          if (not Principal.equal(r.maintainer, caller)) return false;
          let status = RecordsLib.statusOf(r);
          let flag = RecordsLib.expiryOf(r, now);
          status == #missing or flag == ?#nearExpiry or flag == ?#expired;
        });
        let sortedAttention = myAttention.sort(func (a : Records.ArchiveRecord, b : Records.ArchiveRecord) : { #less; #equal; #greater } {
          if (a.id > b.id) #less else if (a.id < b.id) #greater else #equal;
        });

        let toVerify = allRecords.filter(func (r : Records.ArchiveRecord) : Bool {
          RecordsLib.statusOf(r) == #pendingReview
          and Access.hasPermission(state, caller, r.companyId, #verify)
          and not Principal.equal(caller, r.createdBy)
          and not Principal.equal(caller, r.lastModifiedBy);
        });
        let sortedVerify = toVerify.sort(func (a : Records.ArchiveRecord, b : Records.ArchiveRecord) : { #less; #equal; #greater } {
          if (a.id > b.id) #less else if (a.id < b.id) #greater else #equal;
        });

        AuditLib.log(state, caller, #viewDashboard, "首页", null, #success, null);
        #ok({
          role;
          pendingAccounts;
          overview;
          myAttention = sortedAttention.map(func (r : Records.ArchiveRecord) : Records.RecordView = RecordsLib.toView(state, caller, r));
          toVerify = sortedVerify.map(func (r : Records.ArchiveRecord) : Records.RecordView = RecordsLib.toView(state, caller, r));
          unreadNotifications = NotificationsLib.unreadCount(state, caller);
        });
      };
    };
  };
};
