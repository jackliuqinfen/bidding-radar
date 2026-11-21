import {
  AccountRole,
  ApprovalState,
  AuditAction,
  AuditResult,
  ChangeAction,
  ExpiryFlag,
  NotificationKind,
  Permission,
  ProjectType,
  RecordKind,
  RecordStatus,
} from "@/backend";

/** The single canonical wording used across the whole app. */

export const ROLE_LABELS: Record<AccountRole, string> = {
  [AccountRole.admin]: "管理员",
  [AccountRole.member]: "成员",
};

export const APPROVAL_LABELS: Record<ApprovalState, string> = {
  [ApprovalState.pending]: "待批准",
  [ApprovalState.approved]: "已批准",
  [ApprovalState.rejected]: "已拒绝",
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.view]: "查看",
  [Permission.edit]: "编辑",
  [Permission.verify]: "核实",
  [Permission.sensitiveDownload]: "敏感下载",
};

export const PERMISSION_ORDER: Permission[] = [
  Permission.view,
  Permission.edit,
  Permission.verify,
  Permission.sensitiveDownload,
];

export const STATUS_LABELS: Record<RecordStatus, string> = {
  [RecordStatus.missing]: "待补",
  [RecordStatus.pendingReview]: "待核",
  [RecordStatus.verified]: "已核实",
};

export const EXPIRY_LABELS: Record<ExpiryFlag, string> = {
  [ExpiryFlag.nearExpiry]: "临近到期",
  [ExpiryFlag.expired]: "已过期",
};

export const KIND_LABELS: Record<RecordKind, string> = {
  [RecordKind.license]: "证照资质",
  [RecordKind.companyTrack]: "企业业绩",
  [RecordKind.person]: "人员档案",
  [RecordKind.personCert]: "人员证书",
  [RecordKind.personTrack]: "人员业绩",
};

export const KIND_ORDER: RecordKind[] = [
  RecordKind.license,
  RecordKind.companyTrack,
  RecordKind.person,
  RecordKind.personCert,
  RecordKind.personTrack,
];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  [ProjectType.construction]: "施工",
  [ProjectType.goodsEquipment]: "货物设备",
  [ProjectType.service]: "服务",
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  [AuditAction.signIn]: "登录",
  [AuditAction.register]: "注册账号",
  [AuditAction.approveAccount]: "批准账号",
  [AuditAction.approveAsAdmin]: "批准为管理员",
  [AuditAction.rejectAccount]: "拒绝账号",
  [AuditAction.changeAccountRole]: "调整角色",
  [AuditAction.changePermissions]: "调整权限",
  [AuditAction.createCompany]: "新建公司",
  [AuditAction.editCompany]: "编辑公司",
  [AuditAction.createRecord]: "新建档案",
  [AuditAction.editRecord]: "编辑档案",
  [AuditAction.verifyRecord]: "核实档案",
  [AuditAction.resetToPending]: "退回待核",
  [AuditAction.uploadAttachment]: "上传附件",
  [AuditAction.replaceAttachment]: "附件换版",
  [AuditAction.downloadAttachment]: "下载附件",
  [AuditAction.viewSensitive]: "查看敏感信息",
  [AuditAction.viewRecord]: "查看档案",
  [AuditAction.viewHistory]: "查看变更历史",
  [AuditAction.viewCompany]: "查看公司",
  [AuditAction.viewDashboard]: "查看缺口看板",
  [AuditAction.viewList]: "查看列表",
  [AuditAction.viewAuditLog]: "查看审计日志",
  [AuditAction.seedSampleData]: "生成示例数据",
};

export const AUDIT_RESULT_LABELS: Record<AuditResult, string> = {
  [AuditResult.success]: "成功",
  [AuditResult.denied]: "被拒绝",
};

export const CHANGE_ACTION_LABELS: Record<ChangeAction, string> = {
  [ChangeAction.create]: "新建",
  [ChangeAction.update]: "编辑",
  [ChangeAction.verify]: "核实",
  [ChangeAction.resetToPending]: "退回待核",
  [ChangeAction.attachmentAdded]: "上传附件",
  [ChangeAction.attachmentReplaced]: "附件换版",
};

export const NOTIFICATION_KIND_LABELS: Record<NotificationKind, string> = {
  [NotificationKind.nearExpiry]: "临近到期",
  [NotificationKind.expired]: "已过期",
  [NotificationKind.verified]: "已核实",
  [NotificationKind.resetToPending]: "退回待核",
  [NotificationKind.permissionChanged]: "权限变更",
  [NotificationKind.accountApproved]: "账号已批准",
  [NotificationKind.accountRejected]: "账号被拒绝",
  [NotificationKind.pendingUser]: "待批准用户",
};

export const APP_NAME = "投标雷达";
export const APP_TAGLINE = "资质、人员、业绩档案审计系统";
export const SAMPLE_PREFIX = "【虚构】";
