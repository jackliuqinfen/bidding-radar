mixin () {
  public query func getApiDoc() : async Text {
    "# 企业资质档案管理后端 API\n\n" #
    "## 用途\n\n" #
    "本后端管理企业资质档案：公司、证照资质/企业业绩/人员/人员证书/人员业绩记录、附件版本、变更历史、审计日志、通知与缺口看板。所有业务读取都是 update 调用（非 query），因为被拒绝的查看也必须写入审计。\n\n" #
    "## 认证与身份\n\n" #
    "- 所有业务方法都要求已登录（非匿名）调用者。匿名调用返回 `#notSignedIn`。\n" #
    "- 前端固定 Internet Identity 的 derivation origin（若可用，发布在 `/.well-known/ii-derivation-origin`）。已持有用户 Internet Identity 授权的 agent 会针对该 origin 派生正确的按应用 principal（例如 `icp identity link web <name> --app <host>`）。该委托在过期前拥有用户在本应用中的全部权限。\n" #
    "- 注册前置条件：直接调用 API 的调用者必须先以已登录身份调用一次 `registerAccount(displayName)`。第一个注册者成为 管理员 并自动批准；之后注册者为 成员 且状态为 待批准，需 管理员 调用 `approveAccount` 或 `rejectAccount`。未注册调用者在受保护端点收到 `#notRegistered`，待批准者收到 `#pendingApproval`，被拒绝者收到 `#accountRejected`。\n" #
    "- 注册只发生在调用者通过本应用前端登录时，因此从未这样登录过的 principal（即使属于应用所有者）仍是未注册状态；针对不同 origin 派生的 principal 与前端注册的 principal 不同。\n\n" #
    "## 授权\n\n" #
    "- 账号角色：管理员、成员。角色本身不授予任何公司权限。\n" #
    "- 公司权限：查看、编辑、核实、敏感下载，四项相互独立，由 管理员 通过 `setUserCompanyPermissions` 设置，后端在每次调用时强制校验。\n" #
    "- 维护责任人 是记录/公司的负责人字段，不隐含任何权限。\n" #
    "- 每次被拒绝的查看、编辑、核实或下载都会写入一条审计记录（操作人、时间、动作、目标、公司、结果 拒绝、原因），然后返回拒绝错误。\n\n" #
    "## 单位与编码\n\n" #
    "- 时间戳 `Timestamp` 为自 Unix 纪元起的纳秒（`Int`）。日期（有效期起止、竣工/完成日期）为 UTC 午夜纳秒。\n" #
    "- 合同金额单位为 分（`Nat`）。\n" #
    "- 身份证号默认脱敏（如 `110101********1234`）；只有 `viewPersonIdNumber` 在具备 敏感下载 时返回完整值，且该调用被审计。更新时省略、未变更或传入脱敏占位符都会保留已存号码；脱敏文本永不入库。变更历史中的身份证号始终脱敏。\n" #
    "- 附件通过 object-storage 存储，`blob` 为 `Storage.ExternalBlob`；每个附件保留完整版本历史（版本号、上传人、时间、文件名、备注）。\n\n" #
    "## 记录状态与到期\n\n" #
    "- 状态：待补（关键信息缺失）、待核、已核实。状态由数据与核实信息计算得出。\n" #
    "- 到期标记（计算得出，非状态）：临近到期（30 天内）、已过期。\n" #
    "- 实质性字段变更或附件替换会把记录重置为 待核、清除核实人并通知 维护责任人；仅备注变更不重置。核实人不能是当前版本的创建人或最后修改人。\n\n" #
    "## 生命周期与轮询\n\n" #
    "- 每次更新都带版本校验：`updateRecord`、`verifyRecord`、`replaceAttachment` 接收 `expectedVersion`；过期版本返回 `#conflict` 并携带最新记录，不覆盖任何内容。\n" #
    "- 到期通知在 `getGapDashboard`、`getCompanyDetail`、`getHomeSummary` 被调用时按需生成，并按去重键去重。\n" #
    "- 通知通过 `listNotifications` 读取，`getUnreadCount` 获取未读数，`markNotificationRead` / `markAllNotificationsRead` 标记已读。\n\n" #
    "## 变更重试安全\n\n" #
    "- 带 `expectedVersion` 的更新是乐观并发：重试同一版本会得到 `#conflict` 而非重复写入。\n" #
    "- `registerAccount` 对已注册调用者幂等。\n" #
    "- `seedSampleData` 仅 管理员 可调用且幂等：首次生成【虚构】示例数据，之后返回 `alreadySeeded = true`。\n" #
    "- `addAttachment` 每次调用都会创建新附件，重复调用会产生重复附件。\n\n" #
    "## 错误\n\n" #
    "所有业务方法返回 `Result<T, ApiError>`。`ApiError` 变体：`#notSignedIn`、`#notRegistered`、`#pendingApproval`、`#accountRejected`、`#adminOnly`、`#permissionDenied`、`#notFound`、`#conflict`、`#selfVerificationDenied`、`#invalidState`、`#invalidInput`。\n\n" #
    "## 数据查询（OQL）\n\n" #
    "`schema()` 与 `execute(qJson)` 由 OQL 提供，仅控制器可读；人员身份证号列对 OQL 隐藏。\n\n" #
    "## 机会池（招标公告与资格核对）\n\n" #
    "- 公告录入：`createOpportunityDraft` 保存草稿（仅创建人可见可改），`updateOpportunityDraft` 修改草稿，`submitOpportunity` 提交进入机会池（状态 待核对）。公告正文与来源链接必填，缺失时返回 `#invalidInput` 并说明缺项。\n" #
    "- 公告状态：待核对、已选公司参投、不参与、已截止。`changeOpportunityStatus` 必须填写原因并记录状态变更（时间、操作人、原因），可通过 `getOpportunityStatusHistory` 读取；置为 已选公司参投 时至少需一条 符合 的核对结论，否则返回 `#invalidState`。草稿不能变更状态，须先提交。\n" #
    "- 列表：`listOpportunities` 按项目类型、状态、报名截止时间区间、关键词（项目名称/招标人）筛选，可按报名截止时间或录入时间排序；草稿仅创建人可见。列表项含剩余天数与已核对公司数。\n" #
    "- 资格核对：`createCheckItem` / `updateCheckItem` 需该公司 编辑 权限；结论为 符合/不符合/待核，依据说明必填，可引用公告条款片段与公司档案（记录引用时的档案状态）。引用 待核/待补 档案的核对项不能为 符合；公告未写明或资料缺失默认 待核。\n" #
    "- 确认：`confirmCheckItem` 需该公司 核实 权限，创建人不得确认自己提交的结论（返回 `#selfVerificationDenied`）；确认后写入审计并通知公告录入人。已确认的核对项不可再改。\n" #
    "- 可见性：公告与核对结论对所有已批准成员可见；公司佐证信息（`evidence`）仅在具备该公司 查看 权限时返回，否则为空数组。\n" #
    "- 待办：`getOpportunityTodo` 返回临近报名截止（7 天内）的公告与待确认的核对结论。\n" #
    "- 示例数据：`seedSampleData` 同时生成 3 条【虚构】招标公告（已截止、待核对、已选公司参投各一条）与若干【虚构】资格核对结论，覆盖 符合/不符合/待核 并引用已有示例公司档案；保持幂等。\n";
  };
};
