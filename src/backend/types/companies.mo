import Common "common";

module {
  public type Company = {
    id : Common.CompanyId;
    name : Text;
    creditCode : Text; // 统一社会信用代码
    registeredPlace : Text;
    contact : Text;
    maintainer : Principal; // 维护责任人
    createdAt : Common.Timestamp;
    createdBy : Principal;
    updatedAt : Common.Timestamp;
    updatedBy : Principal;
  };

  public type CompanyInput = {
    name : Text;
    creditCode : Text;
    registeredPlace : Text;
    contact : Text;
    maintainer : Principal;
  };

  public type CompanyView = {
    id : Common.CompanyId;
    name : Text;
    creditCode : Text;
    registeredPlace : Text;
    contact : Text;
    maintainer : Principal;
    maintainerName : Text;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };
};
