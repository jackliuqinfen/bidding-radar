import Map "mo:core/Map";
import Time "mo:core/Time";
import Common "../types/common";
import State "../types/state";
import Notifications "../types/notifications";
import Records "../types/records";
import Labels "labels";

module {
  func toView(n : Notifications.Notification) : Notifications.NotificationView {
    {
      id = n.id;
      kind = n.kind;
      kindLabel = Labels.notificationKindLabel(n.kind);
      message = n.message;
      companyId = n.companyId;
      recordId = n.recordId;
      opportunityId = n.opportunityId;
      createdAt = n.createdAt;
      read = n.read;
    };
  };

  /// Adds one notification; when dedupKey is set and already used for this recipient, does nothing.
  public func notify(state : State.State, recipient : Principal, kind : Notifications.NotificationKind, message : Text, companyId : ?Common.CompanyId, recordId : ?Common.RecordId, opportunityId : ?Common.OpportunityId, dedupKey : ?Text) {
    switch (dedupKey) {
      case (?key) {
        let exists = state.notifications.values().any(func (n : Notifications.Notification) : Bool {
          Principal.equal(n.recipient, recipient) and n.dedupKey == ?key;
        });
        if (exists) return;
      };
      case null {};
    };
    let id = state.counters.nextNotificationId;
    state.counters.nextNotificationId := id + 1;
    state.notifications.add(id, {
      id;
      recipient;
      kind;
      message;
      companyId;
      recordId;
      opportunityId;
      createdAt = Time.now();
      read = false;
      dedupKey;
    });
  };

  /// Notifies every approved 管理员.
  public func notifyAdmins(state : State.State, kind : Notifications.NotificationKind, message : Text, dedupKey : ?Text) {
    for (account in state.accounts.values()) {
      if (account.approval == #approved and isAdminAccount(state, account.principal)) {
        notify(state, account.principal, kind, message, null, null, null, dedupKey);
      };
    };
  };

  func isAdminAccount(state : State.State, user : Principal) : Bool {
    switch (state.accessControlState.userRoles.get(user)) {
      case (?#admin) true;
      case _ false;
    };
  };

  func expiryOf(record : Records.ArchiveRecord, now : Common.Timestamp) : ?Records.ExpiryFlag {
    let validTo = switch (record.data) {
      case (#license(d)) d.validTo;
      case (#personCert(d)) d.validTo;
      case _ null;
    };
    switch (validTo) {
      case (?to) {
        if (to <= now) ?#expired
        else if (to - now <= 30 * 24 * 60 * 60 * 1_000_000_000) ?#nearExpiry
        else null;
      };
      case null null;
    };
  };

  /// Caller's notifications, newest first.
  public func list(state : State.State, caller : Principal) : [Notifications.NotificationView] {
    let mine = state.notifications.values().filter(func (n : Notifications.Notification) : Bool {
      Principal.equal(n.recipient, caller);
    }).toArray();
    let sorted = mine.sort(func (a : Notifications.Notification, b : Notifications.Notification) : { #less; #equal; #greater } {
      if (a.id > b.id) #less else if (a.id < b.id) #greater else #equal;
    });
    sorted.map(func (n : Notifications.Notification) : Notifications.NotificationView = toView(n));
  };

  public func unreadCount(state : State.State, caller : Principal) : Nat {
    state.notifications.values().filter(func (n : Notifications.Notification) : Bool {
      Principal.equal(n.recipient, caller) and not n.read;
    }).toArray().size();
  };

  /// false when the notification does not exist or belongs to someone else.
  public func markRead(state : State.State, caller : Principal, id : Common.NotificationId) : Bool {
    switch (state.notifications.get(id)) {
      case (?n) {
        if (not Principal.equal(n.recipient, caller)) return false;
        state.notifications.add(id, { n with read = true });
        true;
      };
      case null false;
    };
  };

  public func markAllRead(state : State.State, caller : Principal) {
    let mine = state.notifications.values().filter(func (n : Notifications.Notification) : Bool {
      Principal.equal(n.recipient, caller) and not n.read;
    }).toArray();
    for (n in mine.values()) {
      state.notifications.add(n.id, { n with read = true });
    };
  };

  /// On-demand de-duplicated 临近到期/已过期 notifications to each record's 维护责任人.
  public func checkExpiry(state : State.State) {
    let now = Time.now();
    for (record in state.records.values()) {
      let flag = switch (expiryOf(record, now)) {
        case (?f) ?f;
        case null null;
      };
      switch (flag) {
        case (?#nearExpiry) {
          let companyName = switch (state.companies.get(record.companyId)) {
            case (?c) c.name;
            case null "";
          };
          notify(
            state,
            record.maintainer,
            #nearExpiry,
            "【" # companyName # "】记录 #" # record.id.toText() # " 临近到期（30 天内），请及时更新。",
            ?record.companyId,
            ?record.id,
            null,
            ?("nearExpiry:" # record.id.toText() # ":" # record.version.toText()),
          );
        };
        case (?#expired) {
          let companyName = switch (state.companies.get(record.companyId)) {
            case (?c) c.name;
            case null "";
          };
          notify(
            state,
            record.maintainer,
            #expired,
            "【" # companyName # "】记录 #" # record.id.toText() # " 已过期，请及时更新。",
            ?record.companyId,
            ?record.id,
            null,
            ?("expired:" # record.id.toText() # ":" # record.version.toText()),
          );
        };
        case null {};
      };
    };
  };

};
