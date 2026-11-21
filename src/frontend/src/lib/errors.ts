import type { ApiError } from "@/backend";
import { PERMISSION_LABELS } from "@/lib/labels";

/** Turn any thrown value into a friendly Chinese message. */
export function describeError(error: unknown): string {
  if (error && typeof error === "object" && "__kind__" in error) {
    return describeApiError(error as ApiError);
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "操作未完成，请稍后重试。";
}

export function describeApiError(error: ApiError): string {
  switch (error.__kind__) {
    case "conflict":
      return "该档案已被他人更新，请对照最新内容后重新提交。";
    case "invalidState":
      return error.invalidState || "当前状态不允许该操作。";
    case "permissionDenied":
      return `缺少「${PERMISSION_LABELS[error.permissionDenied.permission]}」权限，无法执行该操作。`;
    case "invalidInput":
      return error.invalidInput || "填写内容不完整或格式不正确。";
    case "pendingApproval":
      return "账号正在等待管理员批准。";
    case "adminOnly":
      return "该操作仅限管理员。";
    case "selfVerificationDenied":
      return (
        error.selfVerificationDenied || "不能核实本人创建或最后修改的档案。"
      );
    case "notFound":
      return error.notFound || "未找到对应数据。";
    case "notSignedIn":
      return "登录状态已失效，请重新登录。";
    case "notRegistered":
      return "账号尚未注册，请先填写显示名称。";
    case "accountRejected":
      return "账号申请已被拒绝，请联系管理员。";
    default:
      return "操作未完成，请稍后重试。";
  }
}

/** Narrow an ApiResult union to its ok payload, throwing the ApiError otherwise. */
export function unwrap<T>(
  result: { __kind__: "ok"; ok: T } | { __kind__: "err"; err: ApiError },
): T {
  if (result.__kind__ === "ok") return result.ok;
  throw result.err;
}
