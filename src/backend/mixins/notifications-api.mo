import Common "../types/common";
import State "../types/state";
import Notifications "../types/notifications";
import Errors "../types/errors";
import Access "../lib/access";
import NotificationsLib "../lib/notifications";

mixin (state : State.State) {
  /// Approved users only; the caller's notifications, newest first.
  public query ({ caller }) func listNotifications() : async Errors.ApiResult<[Notifications.NotificationView]> {
    switch (Access.requireApproved(state, caller, #viewList, "通知列表", null)) {
      case (#err e) #err e;
      case (#ok _) #ok(NotificationsLib.list(state, caller));
    };
  };

  public query ({ caller }) func getUnreadCount() : async Errors.ApiResult<Nat> {
    switch (Access.requireApproved(state, caller, #viewList, "未读通知数", null)) {
      case (#err e) #err e;
      case (#ok _) #ok(NotificationsLib.unreadCount(state, caller));
    };
  };

  public shared ({ caller }) func markNotificationRead(id : Common.NotificationId) : async Errors.ApiResult<()> {
    switch (Access.requireApproved(state, caller, #viewList, "标记通知已读", null)) {
      case (#err e) #err e;
      case (#ok _) {
        if (NotificationsLib.markRead(state, caller, id)) {
          #ok(());
        } else {
          #err(#notFound("通知不存在"));
        };
      };
    };
  };

  public shared ({ caller }) func markAllNotificationsRead() : async Errors.ApiResult<()> {
    switch (Access.requireApproved(state, caller, #viewList, "全部标记已读", null)) {
      case (#err e) #err e;
      case (#ok _) {
        NotificationsLib.markAllRead(state, caller);
        #ok(());
      };
    };
  };
};
