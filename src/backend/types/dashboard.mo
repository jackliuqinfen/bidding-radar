import Common "common";
import Accounts "accounts";
import Companies "companies";
import Records "records";

module {
  /// 待补, 待核, 已核实, 临近到期, 已过期
  public type GapCounts = {
    missing : Nat;
    pendingReview : Nat;
    verified : Nat;
    nearExpiry : Nat;
    expired : Nat;
  };

  /// Counts only; no private record data.
  public type CompanyGapRow = {
    companyId : Common.CompanyId;
    companyName : Text;
    counts : GapCounts;
    canView : Bool;
  };

  public type CompanyDetail = {
    companyId : Common.CompanyId;
    companyName : Text;
    counts : GapCounts;
    canView : Bool;
    /// null and empty records when the caller lacks 查看
    company : ?Companies.CompanyView;
    records : [Records.RecordView];
  };

  public type HomeSummary = {
    role : Accounts.AccountRole;
    /// 管理员 only; empty for others
    pendingAccounts : [Accounts.AccountView];
    /// 管理员: all companies; others: companies with 查看
    overview : [CompanyGapRow];
    /// records the caller maintains that are 待补, 临近到期 or 已过期
    myAttention : [Records.RecordView];
    /// 待核 records in companies where caller has 核实 and is not creator/last modifier
    toVerify : [Records.RecordView];
    unreadNotifications : Nat;
  };
};
