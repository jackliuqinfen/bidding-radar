import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface AccountView {
    principal: Principal;
    displayName: string;
    role: AccountRole;
    decidedByName?: string;
    approval: ApprovalState;
    roleLabel: string;
    registeredAt: Timestamp;
    decidedAt?: Timestamp;
    approvalLabel: string;
}
export type ApiError = {
    __kind__: "conflict";
    conflict: {
        latest: RecordView;
    };
} | {
    __kind__: "invalidState";
    invalidState: string;
} | {
    __kind__: "permissionDenied";
    permissionDenied: {
        permission: Permission;
        message: string;
        companyId: CompanyId;
    };
} | {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "pendingApproval";
    pendingApproval: null;
} | {
    __kind__: "adminOnly";
    adminOnly: null;
} | {
    __kind__: "selfVerificationDenied";
    selfVerificationDenied: string;
} | {
    __kind__: "notFound";
    notFound: string;
} | {
    __kind__: "notSignedIn";
    notSignedIn: null;
} | {
    __kind__: "notRegistered";
    notRegistered: null;
} | {
    __kind__: "accountRejected";
    accountRejected: null;
};
export type ApiResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_1 = {
    __kind__: "ok";
    ok: RecordView;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_10 = {
    __kind__: "ok";
    ok: AuditPage;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_11 = {
    __kind__: "ok";
    ok: Array<AccountView>;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_12 = {
    __kind__: "ok";
    ok: UserPermissions;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_13 = {
    __kind__: "ok";
    ok: bigint;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_14 = {
    __kind__: "ok";
    ok: Array<ChangeEntryView>;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_15 = {
    __kind__: "ok";
    ok: Array<CompanyPermissionGrant>;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_16 = {
    __kind__: "ok";
    ok: HomeSummary;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_17 = {
    __kind__: "ok";
    ok: Array<CompanyGapRow>;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_18 = {
    __kind__: "ok";
    ok: CompanyDetail;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_19 = {
    __kind__: "ok";
    ok: DownloadInfo;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_2 = {
    __kind__: "ok";
    ok: CompanyView;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_20 = {
    __kind__: "ok";
    ok: AttachmentView;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_3 = {
    __kind__: "ok";
    ok: CompanyPermissionGrant;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_4 = {
    __kind__: "ok";
    ok: AccountView;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_5 = {
    __kind__: "ok";
    ok: SampleReport;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_6 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_7 = {
    __kind__: "ok";
    ok: Array<RecordView>;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_8 = {
    __kind__: "ok";
    ok: Array<NotificationView>;
} | {
    __kind__: "err";
    err: ApiError;
};
export type ApiResult_9 = {
    __kind__: "ok";
    ok: Array<CompanyView>;
} | {
    __kind__: "err";
    err: ApiError;
};
export type AttachmentId = bigint;
export interface AttachmentVersionMeta {
    uploaderName: string;
    note: string;
    fileName: string;
    isSample: boolean;
    version: bigint;
    uploader: Principal;
    uploadedAt: Timestamp;
}
export interface AttachmentView {
    id: AttachmentId;
    fileName: string;
    currentVersion: bigint;
    recordId: RecordId;
    canDownload: boolean;
    versions: Array<AttachmentVersionMeta>;
    sensitive: boolean;
    companyId: CompanyId;
}
export interface AuditEntryView {
    at: Timestamp;
    id: AuditId;
    result: AuditResult;
    denialReason?: string;
    resultLabel: string;
    action: AuditAction;
    actionLabel: string;
    operator: Principal;
    operatorName: string;
    target: string;
    companyName?: string;
    companyId?: CompanyId;
}
export interface AuditFilter {
    result?: AuditResult;
    action?: AuditAction;
    operator?: Principal;
    offset: bigint;
    limit: bigint;
    companyId?: CompanyId;
}
export type AuditId = bigint;
export interface AuditPage {
    total: bigint;
    entries: Array<AuditEntryView>;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface ChangeEntryView {
    at: Timestamp;
    id: HistoryId;
    action: ChangeAction;
    editor: Principal;
    actionLabel: string;
    recordId: RecordId;
    resultingVersion: bigint;
    editorName: string;
    changes: Array<FieldChange>;
}
export interface CompanyDetail {
    records: Array<RecordView>;
    canView: boolean;
    company?: CompanyView;
    companyName: string;
    counts: GapCounts;
    companyId: CompanyId;
}
export interface CompanyGapRow {
    canView: boolean;
    companyName: string;
    counts: GapCounts;
    companyId: CompanyId;
}
export type CompanyId = bigint;
export interface CompanyInput {
    creditCode: string;
    contact: string;
    name: string;
    registeredPlace: string;
    maintainer: Principal;
}
export interface CompanyPermissionGrant {
    permissions: PermissionSet;
    permissionLabels: Array<string>;
    companyName: string;
    companyId: CompanyId;
}
export interface CompanyTrackData {
    completionDate?: Timestamp;
    projectName: string;
    projectType?: ProjectType;
    owner: string;
    contractAmountFen?: bigint;
}
export interface CompanyView {
    id: CompanyId;
    creditCode: string;
    contact: string;
    maintainerName: string;
    name: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    registeredPlace: string;
    maintainer: Principal;
}
export interface DownloadInfo {
    blob: ExternalBlob;
    fileName: string;
    attachmentId: AttachmentId;
    isSample: boolean;
    version: bigint;
    sensitive: boolean;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface FieldChange {
    field: string;
    after: string;
    before: string;
}
export interface GapCounts {
    nearExpiry: bigint;
    pendingReview: bigint;
    verified: bigint;
    expired: bigint;
    missing: bigint;
}
export type HistoryId = bigint;
export interface HomeSummary {
    unreadNotifications: bigint;
    myAttention: Array<RecordView>;
    role: AccountRole;
    overview: Array<CompanyGapRow>;
    pendingAccounts: Array<AccountView>;
    toVerify: Array<RecordView>;
}
export interface LicenseData {
    validFrom?: Timestamp;
    name: string;
    validTo?: Timestamp;
    number: string;
    category: string;
    issuingAuthority: string;
}
export interface NewAttachmentInput {
    blob: ExternalBlob;
    note: string;
    fileName: string;
    recordId: RecordId;
    sensitive: boolean;
}
export type NotificationId = bigint;
export interface NotificationView {
    id: NotificationId;
    kind: NotificationKind;
    createdAt: Timestamp;
    read: boolean;
    kindLabel: string;
    message: string;
    recordId?: RecordId;
    companyId?: CompanyId;
}
export interface PermissionSet {
    edit: boolean;
    view: boolean;
    sensitiveDownload: boolean;
    verify: boolean;
}
export interface PersonCertData {
    validFrom?: Timestamp;
    validTo?: Timestamp;
    personId: RecordId;
    number: string;
    category: string;
    issuingAuthority: string;
}
export interface PersonData {
    name: string;
    idNumber: string;
    phone: string;
    position: string;
}
export interface PersonTrackData {
    completionDate?: Timestamp;
    projectName: string;
    role: string;
    personId: RecordId;
}
export type RecordData = {
    __kind__: "companyTrack";
    companyTrack: CompanyTrackData;
} | {
    __kind__: "person";
    person: PersonData;
} | {
    __kind__: "personCert";
    personCert: PersonCertData;
} | {
    __kind__: "personTrack";
    personTrack: PersonTrackData;
} | {
    __kind__: "license";
    license: LicenseData;
};
export interface RecordFilter {
    status?: RecordStatus;
    kind?: RecordKind;
    search?: string;
    personId?: RecordId;
    maintainer?: Principal;
    category?: string;
    expiry?: ExpiryFlag;
    companyId?: CompanyId;
}
export type RecordId = bigint;
export interface RecordInput {
    data: RecordData;
    maintainer: Principal;
    remarks: string;
    companyId: CompanyId;
}
export interface RecordUpdate {
    data: RecordData;
    maintainer: Principal;
    remarks: string;
}
export interface RecordView {
    id: RecordId;
    status: RecordStatus;
    title: string;
    expiryFlag?: ExpiryFlag;
    data: RecordData;
    maintainerName: string;
    kind: RecordKind;
    createdAt: Timestamp;
    createdBy: Principal;
    version: bigint;
    kindLabel: string;
    createdByName: string;
    maintainer: Principal;
    expiryLabel?: string;
    companyName: string;
    lastModifiedAt: Timestamp;
    lastModifiedBy: Principal;
    statusLabel: string;
    verification?: VerificationView;
    attachments: Array<AttachmentView>;
    lastModifiedByName: string;
    remarks: string;
    companyId: CompanyId;
}
export interface ReplaceAttachmentInput {
    blob: ExternalBlob;
    note: string;
    fileName: string;
    attachmentId: AttachmentId;
    expectedRecordVersion: bigint;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface SampleReport {
    records: bigint;
    attachments: bigint;
    alreadySeeded: boolean;
    companies: bigint;
}
export type Timestamp = bigint;
export interface UserPermissions {
    grants: Array<CompanyPermissionGrant>;
    displayName: string;
    user: Principal;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface VerificationView {
    verifier: Principal;
    verifierName: string;
    verifiedAt: Timestamp;
}
export enum AccountRole {
    member = "member",
    admin = "admin"
}
export enum ApprovalState {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum AuditAction {
    downloadAttachment = "downloadAttachment",
    viewDashboard = "viewDashboard",
    approveAccount = "approveAccount",
    changeAccountRole = "changeAccountRole",
    createRecord = "createRecord",
    rejectAccount = "rejectAccount",
    viewRecord = "viewRecord",
    viewHistory = "viewHistory",
    viewAuditLog = "viewAuditLog",
    viewCompany = "viewCompany",
    createCompany = "createCompany",
    viewList = "viewList",
    seedSampleData = "seedSampleData",
    changePermissions = "changePermissions",
    uploadAttachment = "uploadAttachment",
    signIn = "signIn",
    editCompany = "editCompany",
    resetToPending = "resetToPending",
    replaceAttachment = "replaceAttachment",
    editRecord = "editRecord",
    register = "register",
    approveAsAdmin = "approveAsAdmin",
    viewSensitive = "viewSensitive",
    verifyRecord = "verifyRecord"
}
export enum AuditResult {
    denied = "denied",
    success = "success"
}
export enum ChangeAction {
    attachmentAdded = "attachmentAdded",
    create = "create",
    update = "update",
    attachmentReplaced = "attachmentReplaced",
    verify = "verify",
    resetToPending = "resetToPending"
}
export enum ExpiryFlag {
    nearExpiry = "nearExpiry",
    expired = "expired"
}
export enum NotificationKind {
    nearExpiry = "nearExpiry",
    verified = "verified",
    expired = "expired",
    permissionChanged = "permissionChanged",
    resetToPending = "resetToPending",
    accountApproved = "accountApproved",
    pendingUser = "pendingUser",
    accountRejected = "accountRejected"
}
export enum Permission {
    edit = "edit",
    view = "view",
    sensitiveDownload = "sensitiveDownload",
    verify = "verify"
}
export enum ProjectType {
    service = "service",
    construction = "construction",
    goodsEquipment = "goodsEquipment"
}
export enum RecordKind {
    companyTrack = "companyTrack",
    person = "person",
    personCert = "personCert",
    personTrack = "personTrack",
    license = "license"
}
export enum RecordStatus {
    pendingReview = "pendingReview",
    verified = "verified",
    missing = "missing"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Requires 编辑. The blob comes from the object-storage upload.
     */
    addAttachment(input: NewAttachmentInput): Promise<ApiResult_20>;
    /**
     * / 管理员 only. role #admin = direct approval as 管理员 (audited as such).
     */
    approveAccount(user: Principal, role: AccountRole): Promise<ApiResult_4>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / 管理员 only.
     */
    createCompany(input: CompanyInput): Promise<ApiResult_2>;
    /**
     * / Requires 编辑 on input.companyId.
     */
    createRecord(input: RecordInput): Promise<ApiResult_1>;
    /**
     * / Blob reference only for authorized callers; every attempt audited. version null = current.
     */
    downloadAttachment(attachmentId: AttachmentId, version: bigint | null): Promise<ApiResult_19>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Requires 查看; denial is audited.
     */
    getCompany(id: CompanyId): Promise<ApiResult_2>;
    /**
     * / Records need 查看; without it only counts are returned.
     */
    getCompanyDetail(companyId: CompanyId, filter: RecordFilter): Promise<ApiResult_18>;
    /**
     * / Every company by name with counts only (zeros when empty). Also triggers expiry notifications.
     */
    getGapDashboard(): Promise<ApiResult_17>;
    /**
     * / Role home data. Also triggers expiry notifications.
     */
    getHomeSummary(): Promise<ApiResult_16>;
    /**
     * / Own profile and approval state; allowed for pending users.
     */
    getMyAccount(): Promise<AccountView | null>;
    /**
     * / The caller's own grants.
     */
    getMyPermissions(): Promise<ApiResult_15>;
    /**
     * / Requires 查看; denial audited. ID number masked.
     */
    getRecord(id: RecordId): Promise<ApiResult_1>;
    /**
     * / Requires 查看; ID numbers masked.
     */
    getRecordHistory(id: RecordId): Promise<ApiResult_14>;
    getUnreadCount(): Promise<ApiResult_13>;
    /**
     * / 管理员 only.
     */
    getUserPermissions(user: Principal): Promise<ApiResult_12>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / 管理员 only.
     */
    listAccounts(): Promise<ApiResult_11>;
    /**
     * / 管理员 only; filter by operator, action, result and company.
     */
    listAuditLog(filter: AuditFilter): Promise<ApiResult_10>;
    /**
     * / Only companies where the caller has 查看.
     */
    listCompanies(): Promise<ApiResult_9>;
    /**
     * / Approved users only; the caller's notifications, newest first.
     */
    listNotifications(): Promise<ApiResult_8>;
    /**
     * / Only records in companies where the caller has 查看.
     */
    listRecords(filter: RecordFilter): Promise<ApiResult_7>;
    markAllNotificationsRead(): Promise<ApiResult_6>;
    markNotificationRead(id: NotificationId): Promise<ApiResult_6>;
    /**
     * / First sign-in registration with a display name. The first user becomes 管理员 and is approved; others wait as 待批准.
     */
    registerAccount(displayName: string): Promise<ApiResult_4>;
    /**
     * / 管理员 only.
     */
    rejectAccount(user: Principal): Promise<ApiResult_4>;
    /**
     * / Requires 编辑; keeps older versions; record returns to 待核.
     */
    replaceAttachment(input: ReplaceAttachmentInput): Promise<ApiResult_1>;
    schema(): Promise<string>;
    /**
     * / 管理员 only, idempotent: 【虚构】 sample companies, records and attachments.
     */
    seedSampleData(): Promise<ApiResult_5>;
    /**
     * / 管理员 only: set an approved user's account role to 管理员 or 成员.
     */
    setAccountRole(user: Principal, role: AccountRole): Promise<ApiResult_4>;
    /**
     * / 管理员 only: set 查看/编辑/核实/敏感下载 for a user on a company.
     */
    setUserCompanyPermissions(user: Principal, companyId: CompanyId, permissions: PermissionSet): Promise<ApiResult_3>;
    /**
     * / Audits a sign-in; returns the caller's account or null when not registered yet.
     */
    signIn(): Promise<AccountView | null>;
    /**
     * / Requires 编辑 on the company.
     */
    updateCompany(id: CompanyId, input: CompanyInput): Promise<ApiResult_2>;
    /**
     * / Requires 编辑; expectedVersion must equal the stored version, else #conflict with the latest record.
     */
    updateRecord(id: RecordId, expectedVersion: bigint, change: RecordUpdate): Promise<ApiResult_1>;
    /**
     * / Requires 核实; verifier must not be creator/last modifier of the current version.
     */
    verifyRecord(id: RecordId, expectedVersion: bigint): Promise<ApiResult_1>;
    /**
     * / Full ID number of a 人员 record; requires 敏感下载; audited.
     */
    viewPersonIdNumber(id: RecordId): Promise<ApiResult>;
}
