import { RecordKind } from "@/backend";
import { KIND_LABELS } from "@/lib/labels";

export type FieldType =
  | "text"
  | "textarea"
  | "date"
  | "amount"
  | "select"
  | "idNumber";

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Sensitive fields are masked and only sent when the user types a new value. */
  sensitive?: boolean;
  help?: string;
}

export interface KindConfig {
  kind: RecordKind;
  label: string;
  fields: FieldConfig[];
}

const PROJECT_TYPE_OPTIONS = [
  { value: "construction", label: "施工" },
  { value: "goodsEquipment", label: "货物设备" },
  { value: "service", label: "服务" },
];

export const KIND_CONFIGS: Record<RecordKind, KindConfig> = {
  [RecordKind.license]: {
    kind: RecordKind.license,
    label: KIND_LABELS[RecordKind.license],
    fields: [
      {
        key: "name",
        label: "证照名称",
        type: "text",
        required: true,
        placeholder: "如：建筑工程施工总承包一级",
      },
      {
        key: "number",
        label: "证书编号",
        type: "text",
        required: true,
        placeholder: "证书编号",
      },
      {
        key: "category",
        label: "类别",
        type: "text",
        placeholder: "如：施工资质",
      },
      {
        key: "issuingAuthority",
        label: "发证机关",
        type: "text",
        placeholder: "发证机关",
      },
      { key: "validFrom", label: "生效日期", type: "date" },
      { key: "validTo", label: "有效期至", type: "date" },
    ],
  },
  [RecordKind.companyTrack]: {
    kind: RecordKind.companyTrack,
    label: KIND_LABELS[RecordKind.companyTrack],
    fields: [
      {
        key: "projectName",
        label: "项目名称",
        type: "text",
        required: true,
        placeholder: "项目名称",
      },
      {
        key: "owner",
        label: "建设单位",
        type: "text",
        required: true,
        placeholder: "建设单位",
      },
      {
        key: "projectType",
        label: "项目类型",
        type: "select",
        options: PROJECT_TYPE_OPTIONS,
      },
      {
        key: "contractAmountFen",
        label: "合同金额（元）",
        type: "amount",
        placeholder: "0.00",
      },
      { key: "completionDate", label: "竣工日期", type: "date" },
    ],
  },
  [RecordKind.person]: {
    kind: RecordKind.person,
    label: KIND_LABELS[RecordKind.person],
    fields: [
      {
        key: "name",
        label: "姓名",
        type: "text",
        required: true,
        placeholder: "姓名",
      },
      {
        key: "idNumber",
        label: "身份证号",
        type: "idNumber",
        sensitive: true,
        help: "已脱敏显示，仅在输入新号码时提交",
      },
      { key: "phone", label: "联系电话", type: "text", placeholder: "手机号" },
      {
        key: "position",
        label: "岗位",
        type: "text",
        placeholder: "如：项目经理",
      },
    ],
  },
  [RecordKind.personCert]: {
    kind: RecordKind.personCert,
    label: KIND_LABELS[RecordKind.personCert],
    fields: [
      {
        key: "category",
        label: "证书类别",
        type: "text",
        required: true,
        placeholder: "如：一级建造师",
      },
      {
        key: "number",
        label: "证书编号",
        type: "text",
        required: true,
        placeholder: "证书编号",
      },
      {
        key: "issuingAuthority",
        label: "发证机关",
        type: "text",
        placeholder: "发证机关",
      },
      { key: "validFrom", label: "生效日期", type: "date" },
      { key: "validTo", label: "有效期至", type: "date" },
    ],
  },
  [RecordKind.personTrack]: {
    kind: RecordKind.personTrack,
    label: KIND_LABELS[RecordKind.personTrack],
    fields: [
      {
        key: "projectName",
        label: "项目名称",
        type: "text",
        required: true,
        placeholder: "项目名称",
      },
      {
        key: "role",
        label: "担任角色",
        type: "text",
        required: true,
        placeholder: "如：项目经理",
      },
      { key: "completionDate", label: "竣工日期", type: "date" },
    ],
  },
};

export function kindConfig(kind: RecordKind): KindConfig {
  return KIND_CONFIGS[kind];
}
