import State "../types/state";
import Accounts "../types/accounts";
import Errors "../types/errors";
import AccountsLib "../lib/accounts";

mixin (state : State.State) {
  /// First sign-in registration with a display name. The first user becomes 管理员 and is approved; others wait as 待批准.
  public shared ({ caller }) func registerAccount(displayName : Text) : async Errors.ApiResult<Accounts.AccountView> {
    AccountsLib.register(state, caller, displayName);
  };

  /// Audits a sign-in; returns the caller's account or null when not registered yet.
  public shared ({ caller }) func signIn() : async ?Accounts.AccountView {
    AccountsLib.signIn(state, caller);
  };

  /// Own profile and approval state; allowed for pending users.
  public query ({ caller }) func getMyAccount() : async ?Accounts.AccountView {
    AccountsLib.getMine(state, caller);
  };

  /// 管理员 only.
  public shared ({ caller }) func listAccounts() : async Errors.ApiResult<[Accounts.AccountView]> {
    AccountsLib.list(state, caller);
  };

  /// 管理员 only. role #admin = direct approval as 管理员 (audited as such).
  public shared ({ caller }) func approveAccount(user : Principal, role : Accounts.AccountRole) : async Errors.ApiResult<Accounts.AccountView> {
    AccountsLib.approve(state, caller, user, role);
  };

  /// 管理员 only.
  public shared ({ caller }) func rejectAccount(user : Principal) : async Errors.ApiResult<Accounts.AccountView> {
    AccountsLib.reject(state, caller, user);
  };

  /// 管理员 only: set an approved user's account role to 管理员 or 成员.
  public shared ({ caller }) func setAccountRole(user : Principal, role : Accounts.AccountRole) : async Errors.ApiResult<Accounts.AccountView> {
    AccountsLib.setRole(state, caller, user, role);
  };
};
