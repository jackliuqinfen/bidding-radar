import Result "mo:core/Result";
import Common "common";
import Records "records";

module {
  /// Structured denial/failure. Every denial of a business call is audited before it is returned.
  public type ApiError = {
    #notSignedIn; // anonymous caller
    #notRegistered; // no display name registered yet
    #pendingApproval; // account waits for 管理员 approval
    #accountRejected;
    #adminOnly; // requires account role 管理员
    #permissionDenied : { companyId : Common.CompanyId; permission : Common.Permission; message : Text };
    #notFound : Text;
    /// stale version: the latest stored record is returned, nothing is overwritten
    #conflict : { latest : Records.RecordView };
    #selfVerificationDenied : Text;
    #invalidState : Text;
    #invalidInput : Text;
  };

  public type ApiResult<T> = Result.Result<T, ApiError>;
};
