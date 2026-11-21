import type {
  CompanyTrackData,
  LicenseData,
  PersonCertData,
  PersonData,
  PersonTrackData,
  ProjectType,
  RecordData,
  RecordKind,
} from "@/backend";
import { RecordKind as RecordKindEnum } from "@/backend";
import { KIND_CONFIGS } from "@/components/records/kindConfig";
import { dateInputToTimestamp, fenFromYuanInput } from "@/lib/format";

/** Form values are all strings so the user's input survives any save failure. */
export type FormValues = Record<string, string>;

export function emptyFormValues(kind: RecordKind): FormValues {
  const values: FormValues = {};
  for (const field of KIND_CONFIGS[kind].fields) {
    values[field.key] = "";
  }
  return values;
}

/** Build the backend RecordData variant from form values. */
export function buildRecordData(
  kind: RecordKind,
  values: FormValues,
): RecordData {
  switch (kind) {
    case RecordKindEnum.license: {
      const data: LicenseData = {
        name: values.name?.trim() ?? "",
        number: values.number?.trim() ?? "",
        category: values.category?.trim() ?? "",
        issuingAuthority: values.issuingAuthority?.trim() ?? "",
        validFrom: dateInputToTimestamp(values.validFrom ?? ""),
        validTo: dateInputToTimestamp(values.validTo ?? ""),
      };
      return { __kind__: "license", license: data };
    }
    case RecordKindEnum.companyTrack: {
      const data: CompanyTrackData = {
        projectName: values.projectName?.trim() ?? "",
        owner: values.owner?.trim() ?? "",
        projectType: (values.projectType || undefined) as
          | ProjectType
          | undefined,
        contractAmountFen: fenFromYuanInput(values.contractAmountFen ?? ""),
        completionDate: dateInputToTimestamp(values.completionDate ?? ""),
      };
      return { __kind__: "companyTrack", companyTrack: data };
    }
    case RecordKindEnum.person: {
      const data: PersonData = {
        name: values.name?.trim() ?? "",
        idNumber: values.idNumber?.trim() ?? "",
        phone: values.phone?.trim() ?? "",
        position: values.position?.trim() ?? "",
      };
      return { __kind__: "person", person: data };
    }
    case RecordKindEnum.personCert: {
      const data: PersonCertData = {
        personId: 0n,
        category: values.category?.trim() ?? "",
        number: values.number?.trim() ?? "",
        issuingAuthority: values.issuingAuthority?.trim() ?? "",
        validFrom: dateInputToTimestamp(values.validFrom ?? ""),
        validTo: dateInputToTimestamp(values.validTo ?? ""),
      };
      return { __kind__: "personCert", personCert: data };
    }
    case RecordKindEnum.personTrack: {
      const data: PersonTrackData = {
        personId: 0n,
        projectName: values.projectName?.trim() ?? "",
        role: values.role?.trim() ?? "",
        completionDate: dateInputToTimestamp(values.completionDate ?? ""),
      };
      return { __kind__: "personTrack", personTrack: data };
    }
  }
}
