import type { OpportunityInput, ProjectType } from "@/backend";
import { ProjectType as ProjectTypeEnum } from "@/backend";
import { dateInputToTimestamp, fenFromYuanInput } from "@/lib/format";

/** Editable draft of a tender announcement, all values as raw input strings. */
export interface AnnouncementFormValues {
  projectName: string;
  tenderer: string;
  projectType: ProjectType;
  sourceName: string;
  sourceUrl: string;
  publishDate: string;
  registrationDeadline: string;
  bidOpenTime: string;
  budgetYuan: string;
  body: string;
}

export function emptyAnnouncementValues(): AnnouncementFormValues {
  return {
    projectName: "",
    tenderer: "",
    projectType: ProjectTypeEnum.construction,
    sourceName: "",
    sourceUrl: "",
    publishDate: "",
    registrationDeadline: "",
    bidOpenTime: "",
    budgetYuan: "",
    body: "",
  };
}

export interface AnnouncementFieldIssue {
  key: keyof AnnouncementFormValues;
  label: string;
  message: string;
}

const URL_PATTERN = /^https?:\/\/\S+$/i;

/**
 * Validates the draft and names every missing or malformed field, so the
 * dialog can point at the exact gap instead of a generic failure.
 */
export function validateAnnouncement(
  values: AnnouncementFormValues,
): AnnouncementFieldIssue[] {
  const issues: AnnouncementFieldIssue[] = [];
  const require = (key: keyof AnnouncementFormValues, label: string) => {
    if (!values[key].trim()) {
      issues.push({ key, label, message: `请填写${label}` });
    }
  };

  require("projectName", "项目名称");
  require("tenderer", "招标人");
  require("sourceName", "公告来源");
  require("publishDate", "公告发布日期");
  require("registrationDeadline", "报名截止时间");
  require("bidOpenTime", "开标时间");
  require("body", "公告正文");

  const url = values.sourceUrl.trim();
  if (!url) {
    issues.push({
      key: "sourceUrl",
      label: "公告链接",
      message: "请填写公告链接",
    });
  } else if (!URL_PATTERN.test(url)) {
    issues.push({
      key: "sourceUrl",
      label: "公告链接",
      message: "公告链接需以 http:// 或 https:// 开头",
    });
  }

  const budget = values.budgetYuan.trim();
  if (budget && fenFromYuanInput(budget) === undefined) {
    issues.push({
      key: "budgetYuan",
      label: "预算金额",
      message: "预算金额需为不小于 0 的数字",
    });
  }

  return issues;
}

/** Converts a validated draft into the backend OpportunityInput contract. */
export function toOpportunityInput(
  values: AnnouncementFormValues,
): OpportunityInput {
  const publishDate = dateInputToTimestamp(values.publishDate);
  const registrationDeadline = dateInputToTimestamp(
    values.registrationDeadline,
  );
  const bidOpenTime = dateInputToTimestamp(values.bidOpenTime);
  if (
    publishDate === undefined ||
    registrationDeadline === undefined ||
    bidOpenTime === undefined
  ) {
    throw new Error("日期格式不正确，请重新选择。");
  }
  return {
    projectName: values.projectName.trim(),
    tenderer: values.tenderer.trim(),
    projectType: values.projectType,
    sourceName: values.sourceName.trim(),
    sourceUrl: values.sourceUrl.trim(),
    publishDate,
    registrationDeadline,
    bidOpenTime,
    budgetYuan: fenFromYuanInput(values.budgetYuan),
    body: values.body.trim(),
    clauses: [],
  };
}
