import Common "../types/common";
import State "../types/state";
import Records "../types/records";
import Errors "../types/errors";
import RecordsLib "../lib/records";

mixin (state : State.State) {
  /// Requires 编辑 on input.companyId.
  public shared ({ caller }) func createRecord(input : Records.RecordInput) : async Errors.ApiResult<Records.RecordView> {
    RecordsLib.create(state, caller, input);
  };

  /// Requires 编辑; expectedVersion must equal the stored version, else #conflict with the latest record.
  public shared ({ caller }) func updateRecord(id : Common.RecordId, expectedVersion : Nat, change : Records.RecordUpdate) : async Errors.ApiResult<Records.RecordView> {
    RecordsLib.update(state, caller, id, expectedVersion, change);
  };

  /// Requires 查看; denial audited. ID number masked.
  public shared ({ caller }) func getRecord(id : Common.RecordId) : async Errors.ApiResult<Records.RecordView> {
    RecordsLib.get(state, caller, id);
  };

  /// Only records in companies where the caller has 查看.
  public shared ({ caller }) func listRecords(filter : Records.RecordFilter) : async Errors.ApiResult<[Records.RecordView]> {
    RecordsLib.list(state, caller, filter);
  };

  /// Requires 核实; verifier must not be creator/last modifier of the current version.
  public shared ({ caller }) func verifyRecord(id : Common.RecordId, expectedVersion : Nat) : async Errors.ApiResult<Records.RecordView> {
    RecordsLib.verify(state, caller, id, expectedVersion);
  };

  /// Requires 查看; ID numbers masked.
  public shared ({ caller }) func getRecordHistory(id : Common.RecordId) : async Errors.ApiResult<[Records.ChangeEntryView]> {
    RecordsLib.history(state, caller, id);
  };

  /// Full ID number of a 人员 record; requires 敏感下载; audited.
  public shared ({ caller }) func viewPersonIdNumber(id : Common.RecordId) : async Errors.ApiResult<Text> {
    RecordsLib.viewIdNumber(state, caller, id);
  };
};
