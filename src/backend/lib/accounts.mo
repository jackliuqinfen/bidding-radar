import Map "mo:core/Map";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import State "../types/state";
import Accounts "../types/accounts";
import Audit "../types/audit";
import Errors "../types/errors";
import AuditLib "audit";
import NotificationsLib "notifications";
import Labels "labels";

module {
  public func toView(state : State.State, account : Accounts.Account) : Accounts.AccountView {
    let role : Accounts.AccountRole = if (isAdmin(state, account.principal)) #admin else #member;
    {
      principal = account.principal;
      displayName = account.displayName;
      role;
      roleLabel = Labels.roleLabel(role);
      approval = account.approval;
      approvalLabel = Labels.approvalLabel(account.approval);
      registeredAt = account.registeredAt;
      decidedAt = account.decidedAt;
      decidedByName = switch (account.decidedBy) {
        case (?p) switch (state.accounts.get(p)) {
          case (?a) ?a.displayName;
          case null null;
        };
        case null null;
      };
    };
  };

  func isAdmin(state : State.State, user : Principal) : Bool {
    switch (state.accessControlState.userRoles.get(user)) {
      case (?#admin) true;
      case _ false;
    };
  };

  func adminCount(state : State.State) : Nat {
    state.accounts.values().filter(func (a : Accounts.Account) : Bool {
      a.approval == #approved and isAdmin(state, a.principal);
    }).toArray().size();
  };

  /// Own account, if registered (readable even while pending).
  public func getMine(state : State.State, caller : Principal) : ?Accounts.AccountView {
    switch (state.accounts.get(caller)) {
      case (?a) ?toView(state, a);
      case null null;
    };
  };

  /// First registration: initializes the authorization role (first user becomes 管理员 and is approved);
  /// others become 成员 with #pending and 管理员 are notified. Audited. Idempotent for registered users.
  public func register(state : State.State, caller : Principal, displayName : Text) : Errors.ApiResult<Accounts.AccountView> {
    if (caller.isAnonymous()) {
      AuditLib.log(state, caller, #register, displayName, null, #denied, ?"未登录");
      return #err(#notSignedIn);
    };
    switch (state.accounts.get(caller)) {
      case (?existing) {
        AuditLib.log(state, caller, #register, existing.displayName, null, #success, null);
        return #ok(toView(state, existing));
      };
      case null {};
    };
    let name = if (displayName.size() == 0) "未命名用户" else displayName;
    let isFirst = state.accounts.size() == 0;
    AccessControl.initialize(state.accessControlState, caller);
    let now = Time.now();
    let account : Accounts.Account = {
      principal = caller;
      displayName = name;
      approval = if (isFirst) #approved else #pending;
      registeredAt = now;
      decidedAt = if (isFirst) ?now else null;
      decidedBy = null;
    };
    state.accounts.add(caller, account);
    AuditLib.log(state, caller, #register, name, null, #success, null);
    if (not isFirst) {
      NotificationsLib.notifyAdmins(
        state,
        #pendingUser,
        "新用户【" # name # "】申请加入，等待批准。",
        ?("pendingUser:" # caller.toText()),
      );
    };
    #ok(toView(state, account));
  };

  /// Audits a sign-in of a registered caller and returns the account (null when not registered yet).
  public func signIn(state : State.State, caller : Principal) : ?Accounts.AccountView {
    switch (state.accounts.get(caller)) {
      case (?a) {
        AuditLib.log(state, caller, #signIn, a.displayName, null, #success, null);
        ?toView(state, a);
      };
      case null null;
    };
  };

  /// 管理员 only.
  public func list(state : State.State, caller : Principal) : Errors.ApiResult<[Accounts.AccountView]> {
    switch (requireAdmin(state, caller, #viewList, "账号列表")) {
      case (#err e) #err e;
      case (#ok _) {
        let all = state.accounts.values().toArray();
        let sorted = all.sort(func (a : Accounts.Account, b : Accounts.Account) : { #less; #equal; #greater } {
          if (a.registeredAt > b.registeredAt) #less
          else if (a.registeredAt < b.registeredAt) #greater
          else #equal;
        });
        #ok(sorted.map(func (a : Accounts.Account) : Accounts.AccountView = toView(state, a)));
      };
    };
  };

  func requireAdmin(state : State.State, caller : Principal, action : Audit.AuditAction, target : Text) : Errors.ApiResult<()> {
    if (caller.isAnonymous()) {
      AuditLib.log(state, caller, action, target, null, #denied, ?"未登录");
      return #err(#notSignedIn);
    };
    switch (state.accounts.get(caller)) {
      case null {
        AuditLib.log(state, caller, action, target, null, #denied, ?"未注册");
        return #err(#notRegistered);
      };
      case (?a) {
        switch (a.approval) {
          case (#approved) {};
          case (#pending) {
            AuditLib.log(state, caller, action, target, null, #denied, ?"账号待批准");
            return #err(#pendingApproval);
          };
          case (#rejected) {
            AuditLib.log(state, caller, action, target, null, #denied, ?"账号已拒绝");
            return #err(#accountRejected);
          };
        };
      };
    };
    if (isAdmin(state, caller)) {
      #ok(());
    } else {
      AuditLib.log(state, caller, action, target, null, #denied, ?"需要管理员角色");
      #err(#adminOnly);
    };
  };

  /// 管理员 only. Role #admin is a direct approval as 管理员 and gets its own audit action. Notifies the user.
  public func approve(state : State.State, caller : Principal, user : Principal, role : Accounts.AccountRole) : Errors.ApiResult<Accounts.AccountView> {
    let action : Audit.AuditAction = switch (role) {
      case (#admin) #approveAsAdmin;
      case (#member) #approveAccount;
    };
    switch (requireAdmin(state, caller, action, "批准账号")) {
      case (#err e) #err e;
      case (#ok _) {
        switch (state.accounts.get(user)) {
          case null {
            AuditLib.log(state, caller, action, user.toText(), null, #denied, ?"账号不存在");
            #err(#notFound("账号不存在"));
          };
          case (?a) {
            let now = Time.now();
            let updated : Accounts.Account = {
              a with
              approval = #approved;
              decidedAt = ?now;
              decidedBy = ?caller;
            };
            state.accounts.add(user, updated);
            switch (role) {
              case (#admin) {
                state.accessControlState.userRoles.add(user, #admin);
                state.accessControlState.adminAssigned := true;
              };
              case (#member) {
                if (not isAdmin(state, user)) {
                  state.accessControlState.userRoles.add(user, #user);
                };
              };
            };
            AuditLib.log(state, caller, action, a.displayName, null, #success, null);
            NotificationsLib.notify(
              state,
              user,
              #accountApproved,
              "您的账号已批准，角色：" # Labels.roleLabel(role) # "。",
              null,
              null,
              null,
            );
            #ok(toView(state, updated));
          };
        };
      };
    };
  };

  /// 管理员 only. Audited; notifies the user.
  public func reject(state : State.State, caller : Principal, user : Principal) : Errors.ApiResult<Accounts.AccountView> {
    switch (requireAdmin(state, caller, #rejectAccount, "拒绝账号")) {
      case (#err e) #err e;
      case (#ok _) {
        switch (state.accounts.get(user)) {
          case null {
            AuditLib.log(state, caller, #rejectAccount, user.toText(), null, #denied, ?"账号不存在");
            #err(#notFound("账号不存在"));
          };
          case (?a) {
            let now = Time.now();
            let updated : Accounts.Account = {
              a with
              approval = #rejected;
              decidedAt = ?now;
              decidedBy = ?caller;
            };
            state.accounts.add(user, updated);
            AuditLib.log(state, caller, #rejectAccount, a.displayName, null, #success, null);
            NotificationsLib.notify(
              state,
              user,
              #accountRejected,
              "您的账号申请已被拒绝。",
              null,
              null,
              null,
            );
            #ok(toView(state, updated));
          };
        };
      };
    };
  };

  /// 管理员 only; only for approved users; the last 管理员 cannot be demoted. Audited.
  public func setRole(state : State.State, caller : Principal, user : Principal, role : Accounts.AccountRole) : Errors.ApiResult<Accounts.AccountView> {
    switch (requireAdmin(state, caller, #changeAccountRole, "变更账号角色")) {
      case (#err e) #err e;
      case (#ok _) {
        switch (state.accounts.get(user)) {
          case null {
            AuditLib.log(state, caller, #changeAccountRole, user.toText(), null, #denied, ?"账号不存在");
            #err(#notFound("账号不存在"));
          };
          case (?a) {
            if (a.approval != #approved) {
              AuditLib.log(state, caller, #changeAccountRole, a.displayName, null, #denied, ?"账号未批准");
              return #err(#invalidState("只能为已批准账号设置角色"));
            };
            switch (role) {
              case (#member) {
                if (isAdmin(state, user) and adminCount(state) <= 1) {
                  AuditLib.log(state, caller, #changeAccountRole, a.displayName, null, #denied, ?"不能降级最后一位管理员");
                  return #err(#invalidState("不能降级最后一位管理员"));
                };
                state.accessControlState.userRoles.add(user, #user);
              };
              case (#admin) {
                state.accessControlState.userRoles.add(user, #admin);
                state.accessControlState.adminAssigned := true;
              };
            };
            AuditLib.log(state, caller, #changeAccountRole, a.displayName, null, #success, null);
            #ok(toView(state, a));
          };
        };
      };
    };
  };
};
