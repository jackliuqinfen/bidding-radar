import State "../types/state";
import Sample "../types/sample";
import Errors "../types/errors";
import SampleLib "../lib/sample";

mixin (state : State.State) {
  /// 管理员 only, idempotent: 【虚构】 sample companies, records and attachments.
  public shared ({ caller }) func seedSampleData() : async Errors.ApiResult<Sample.SampleReport> {
    SampleLib.seed(state, caller);
  };
};
