import Common "../types/common";
import Accounts "../types/accounts";
import Records "../types/records";
import Audit "../types/audit";
import Notifications "../types/notifications";

/// Fixed Chinese labels. Roles: 管理员, 成员. Permissions: 查看, 编辑, 核实, 敏感下载. Also 维护责任人.
module {
  public func roleLabel(role : Accounts.AccountRole) : Text {
    switch role {
      case (#admin) "管理员";
      case (#member) "成员";
    };
  };

  public func approvalLabel(approval : Accounts.ApprovalState) : Text {
    switch approval {
      case (#pending) "待批准";
      case (#approved) "已批准";
      case (#rejected) "已拒绝";
    };
  };

  public func permissionLabel(permission : Common.Permission) : Text {
    switch permission {
      case (#view) "查看";
      case (#edit) "编辑";
      case (#verify) "核实";
      case (#sensitiveDownload) "敏感下载";
    };
  };

  public func permissionLabels(permissions : Common.PermissionSet) : [Text] {
    let out = [];
    let a = if (permissions.view) out.concat(["查看"]) else out;
    let b = if (permissions.edit) a.concat(["编辑"]) else a;
    let c = if (permissions.verify) b.concat(["核实"]) else b;
    if (permissions.sensitiveDownload) c.concat(["敏感下载"]) else c;
  };

  public func maintainerLabel() : Text {
    "维护责任人";
  };

  public func kindLabel(kind : Records.RecordKind) : Text {
    switch kind {
      case (#license) "证照资质";
      case (#companyTrack) "企业业绩";
      case (#person) "人员";
      case (#personCert) "人员证书";
      case (#personTrack) "人员业绩";
    };
  };

  public func projectTypeLabel(projectType : Records.ProjectType) : Text {
    switch projectType {
      case (#construction) "工程施工";
      case (#goodsEquipment) "货物设备";
      case (#service) "服务";
    };
  };

  public func statusLabel(status : Records.RecordStatus) : Text {
    switch status {
      case (#missing) "待补";
      case (#pendingReview) "待核";
      case (#verified) "已核实";
    };
  };

  public func expiryLabel(flag : Records.ExpiryFlag) : Text {
    switch flag {
      case (#nearExpiry) "临近到期";
      case (#expired) "已过期";
    };
  };

  public func changeActionLabel(action : Records.ChangeAction) : Text {
    switch action {
      case (#create) "新建";
      case (#update) "修改";
      case (#verify) "核实";
      case (#resetToPending) "重置为待核";
      case (#attachmentAdded) "新增附件";
      case (#attachmentReplaced) "替换附件";
    };
  };

  public func auditActionLabel(action : Audit.AuditAction) : Text {
    switch action {
      case (#signIn) "登录";
      case (#register) "注册";
      case (#approveAccount) "批准账号";
      case (#approveAsAdmin) "批准为管理员";
      case (#rejectAccount) "拒绝账号";
      case (#changeAccountRole) "变更账号角色";
      case (#changePermissions) "变更权限";
      case (#createCompany) "新建公司";
      case (#editCompany) "编辑公司";
      case (#viewCompany) "查看公司";
      case (#viewRecord) "查看记录";
      case (#viewList) "查看列表";
      case (#viewHistory) "查看变更历史";
      case (#viewSensitive) "查看敏感信息";
      case (#createRecord) "新建记录";
      case (#editRecord) "编辑记录";
      case (#verifyRecord) "核实记录";
      case (#resetToPending) "重置为待核";
      case (#uploadAttachment) "上传附件";
      case (#replaceAttachment) "替换附件";
      case (#downloadAttachment) "下载附件";
      case (#viewDashboard) "查看看板";
      case (#viewAuditLog) "查看审计日志";
      case (#seedSampleData) "生成示例数据";
      case (#createOpportunity) "录入公告";
      case (#submitOpportunity) "提交公告";
      case (#changeOpportunityStatus) "变更公告状态";
      case (#createCheckItem) "新建核对结论";
      case (#editCheckItem) "修改核对结论";
      case (#confirmCheckItem) "确认核对结论";
    };
  };

  public func auditResultLabel(result : Audit.AuditResult) : Text {
    switch result {
      case (#success) "成功";
      case (#denied) "拒绝";
    };
  };

  public func notificationKindLabel(kind : Notifications.NotificationKind) : Text {
    switch kind {
      case (#pendingUser) "待批准用户";
      case (#accountApproved) "账号已批准";
      case (#accountRejected) "账号已拒绝";
      case (#permissionChanged) "权限变更";
      case (#resetToPending) "记录重置为待核";
      case (#nearExpiry) "临近到期";
      case (#expired) "已过期";
      case (#verified) "记录已核实";
      case (#checkItemConfirmed) "核对结论已确认";
    };
  };
};
