import Map "mo:core/Map";
import Time "mo:core/Time";
import Common "../types/common";
import State "../types/state";
import Companies "../types/companies";
import Audit "../types/audit";
import Errors "../types/errors";
import Access "access";
import AuditLib "audit";

module {
  public func toView(state : State.State, company : Companies.Company) : Companies.CompanyView {
    {
      id = company.id;
      name = company.name;
      creditCode = company.creditCode;
      registeredPlace = company.registeredPlace;
      contact = company.contact;
      maintainer = company.maintainer;
      maintainerName = Access.displayName(state, company.maintainer);
      createdAt = company.createdAt;
      updatedAt = company.updatedAt;
    };
  };

  public func nameOf(state : State.State, companyId : Common.CompanyId) : Text {
    switch (state.companies.get(companyId)) {
      case (?c) c.name;
      case null "";
    };
  };

  func validateInput(input : Companies.CompanyInput) : ?Text {
    if (input.name.size() == 0) return ?"公司名称不能为空";
    null;
  };

  /// 管理员 only; maintainer must be an approved user. Audited.
  public func create(state : State.State, caller : Principal, input : Companies.CompanyInput) : Errors.ApiResult<Companies.CompanyView> {
    switch (Access.requireAdmin(state, caller, #createCompany, "新建公司")) {
      case (#err e) #err e;
      case (#ok _) {
        switch (validateInput(input)) {
          case (?msg) {
            AuditLib.log(state, caller, #createCompany, input.name, null, #denied, ?msg);
            return #err(#invalidInput(msg));
          };
          case null {};
        };
        if (not Access.isApproved(state, input.maintainer)) {
          AuditLib.log(state, caller, #createCompany, input.name, null, #denied, ?"维护责任人必须是已批准用户");
          return #err(#invalidInput("维护责任人必须是已批准用户"));
        };
        let id = state.counters.nextCompanyId;
        state.counters.nextCompanyId := id + 1;
        let now = Time.now();
        let company : Companies.Company = {
          id;
          name = input.name;
          creditCode = input.creditCode;
          registeredPlace = input.registeredPlace;
          contact = input.contact;
          maintainer = input.maintainer;
          createdAt = now;
          createdBy = caller;
          updatedAt = now;
          updatedBy = caller;
        };
        state.companies.add(id, company);
        AuditLib.log(state, caller, #createCompany, company.name, ?id, #success, null);
        #ok(toView(state, company));
      };
    };
  };

  /// Requires 编辑 on the company. Audited.
  public func update(state : State.State, caller : Principal, id : Common.CompanyId, input : Companies.CompanyInput) : Errors.ApiResult<Companies.CompanyView> {
    switch (Access.requirePermission(state, caller, id, #edit, #editCompany, "编辑公司")) {
      case (#err e) #err e;
      case (#ok _) {
        switch (state.companies.get(id)) {
          case null {
            AuditLib.log(state, caller, #editCompany, "公司 #" # id.toText(), ?id, #denied, ?"公司不存在");
            return #err(#notFound("公司不存在"));
          };
          case (?company) {
            switch (validateInput(input)) {
              case (?msg) {
                AuditLib.log(state, caller, #editCompany, company.name, ?id, #denied, ?msg);
                return #err(#invalidInput(msg));
              };
              case null {};
            };
            if (not Access.isApproved(state, input.maintainer)) {
              AuditLib.log(state, caller, #editCompany, company.name, ?id, #denied, ?"维护责任人必须是已批准用户");
              return #err(#invalidInput("维护责任人必须是已批准用户"));
            };
            let updated : Companies.Company = {
              company with
              name = input.name;
              creditCode = input.creditCode;
              registeredPlace = input.registeredPlace;
              contact = input.contact;
              maintainer = input.maintainer;
              updatedAt = Time.now();
              updatedBy = caller;
            };
            state.companies.add(id, updated);
            AuditLib.log(state, caller, #editCompany, updated.name, ?id, #success, null);
            #ok(toView(state, updated));
          };
        };
      };
    };
  };

  /// Requires 查看 on the company; denial is audited.
  public func get(state : State.State, caller : Principal, id : Common.CompanyId) : Errors.ApiResult<Companies.CompanyView> {
    switch (Access.requirePermission(state, caller, id, #view, #viewCompany, "查看公司")) {
      case (#err e) #err e;
      case (#ok _) {
        switch (state.companies.get(id)) {
          case (?company) {
            AuditLib.log(state, caller, #viewCompany, company.name, ?id, #success, null);
            #ok(toView(state, company));
          };
          case null {
            AuditLib.log(state, caller, #viewCompany, "公司 #" # id.toText(), ?id, #denied, ?"公司不存在");
            #err(#notFound("公司不存在"));
          };
        };
      };
    };
  };

  /// Only companies where the caller has 查看.
  public func listVisible(state : State.State, caller : Principal) : Errors.ApiResult<[Companies.CompanyView]> {
    switch (Access.requireApproved(state, caller, #viewList, "公司列表", null)) {
      case (#err e) #err e;
      case (#ok _) {
        let all = state.companies.values().toArray();
        let visible = all.filter(func (c : Companies.Company) : Bool {
          Access.hasPermission(state, caller, c.id, #view);
        });
        let sorted = visible.sort(func (a : Companies.Company, b : Companies.Company) : { #less; #equal; #greater } {
          if (a.name < b.name) #less else if (a.name > b.name) #greater else #equal;
        });
        #ok(sorted.map(func (c : Companies.Company) : Companies.CompanyView = toView(state, c)));
      };
    };
  };
};
