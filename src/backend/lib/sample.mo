import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Common "../types/common";
import State "../types/state";
import Records "../types/records";
import Attachments "../types/attachments";
import Audit "../types/audit";
import Sample "../types/sample";
import Errors "../types/errors";
import Access "access";
import AuditLib "audit";
import RecordsLib "records";
import CompaniesLib "companies";
import Companies "../types/companies";
import PermissionsLib "permissions";
import AttachmentsLib "attachments";

module {
  let DAY_NS : Int = 86_400_000_000_000;

  func utcMidnight(now : Common.Timestamp) : Common.Timestamp {
    let day = DAY_NS;
    let rem = now % day;
    let base = now - rem;
    if (rem < 0) base - day else base;
  };

  func sampleBlob(tag : Text) : Blob {
    ("【虚构】示例附件：" # tag).encodeUtf8();
  };

  /// 管理员 only, idempotent. Creates 【虚构】 companies, licenses, personnel, certificates, track records and sample
  /// attachments covering every status and expiry flag through the normal record/attachment/audit paths.
  /// Grants the calling 管理员 the four permissions on the sample companies via the audited permission path.
  public func seed(state : State.State, caller : Principal) : Errors.ApiResult<Sample.SampleReport> {
    switch (Access.requireAdmin(state, caller, #seedSampleData, "生成示例数据")) {
      case (#err e) #err e;
      case (#ok _) {
        if (state.counters.sampleSeeded) {
          return #ok({ alreadySeeded = true; companies = 0; records = 0; attachments = 0 });
        };
        state.counters.sampleSeeded := true;

        let now = Time.now();
        let today = utcMidnight(now);
        let allPermissions : Common.PermissionSet = {
          view = true;
          edit = true;
          verify = true;
          sensitiveDownload = true;
        };

        let companyInputs : [Companies.CompanyInput] = [
          {
            name = "【虚构】宏远建设有限公司";
            creditCode = "91330000MA2XXXXX01";
            registeredPlace = "浙江省杭州市";
            contact = "0571-88880001";
            maintainer = caller;
          },
          {
            name = "【虚构】恒信设备制造有限公司";
            creditCode = "91320000MA2XXXXX02";
            registeredPlace = "江苏省南京市";
            contact = "025-66660002";
            maintainer = caller;
          },
        ];

        var companyCount = 0;
        var recordCount = 0;
        var attachmentCount = 0;
        let companyIds = List.empty<Common.CompanyId>();

        for (input in companyInputs.values()) {
          switch (CompaniesLib.create(state, caller, input)) {
            case (#ok(view)) {
              companyCount += 1;
              companyIds.add(view.id);
              switch (PermissionsLib.set(state, caller, caller, view.id, allPermissions)) {
                case (#ok _) {};
                case (#err _) {};
              };
            };
            case (#err _) {};
          };
        };

        // Records per company, covering 待补 / 待核 / 已核实 and 临近到期 / 已过期.
        for (companyId in companyIds.values()) {
          let records : [Records.RecordInput] = [
            // 已核实, valid far in the future
            {
              companyId;
              data = #license({
                category = "施工资质";
                name = "【虚构】建筑工程施工总承包一级";
                number = "D133000001";
                issuingAuthority = "住房和城乡建设部";
                validFrom = ?(today - 365 * DAY_NS);
                validTo = ?(today + 365 * DAY_NS);
              });
              maintainer = caller;
              remarks = "【虚构】示例数据";
            },
            // 待核, 临近到期 (within 30 days)
            {
              companyId;
              data = #license({
                category = "安全生产许可";
                name = "【虚构】安全生产许可证";
                number = "（浙）JZ安许证字0001";
                issuingAuthority = "浙江省住房和城乡建设厅";
                validFrom = ?(today - 700 * DAY_NS);
                validTo = ?(today + 10 * DAY_NS);
              });
              maintainer = caller;
              remarks = "【虚构】示例数据";
            },
            // 待核, 已过期
            {
              companyId;
              data = #license({
                category = "营业执照";
                name = "【虚构】营业执照";
                number = "91330000MA2XXXXX01";
                issuingAuthority = "市场监督管理局";
                validFrom = ?(today - 1000 * DAY_NS);
                validTo = ?(today - 5 * DAY_NS);
              });
              maintainer = caller;
              remarks = "【虚构】示例数据";
            },
            // 待补 (missing key data)
            {
              companyId;
              data = #license({
                category = "";
                name = "【虚构】待补充资质";
                number = "";
                issuingAuthority = "";
                validFrom = null;
                validTo = null;
              });
              maintainer = caller;
              remarks = "【虚构】示例数据，待补充";
            },
            // 企业业绩
            {
              companyId;
              data = #companyTrack({
                projectName = "【虚构】某市政道路工程";
                owner = "【虚构】某市城建集团";
                projectType = ?#construction;
                contractAmountFen = ?120_000_000;
                completionDate = ?(today - 200 * DAY_NS);
              });
              maintainer = caller;
              remarks = "【虚构】示例数据";
            },
          ];

          for (input in records.values()) {
            switch (RecordsLib.create(state, caller, input)) {
              case (#ok view) {
                recordCount += 1;
                // Attach one sample file to the first record of each company.
                if (recordCount % 5 == 1) {
                  switch (AttachmentsLib.add(state, caller, {
                    recordId = view.id;
                    fileName = "【虚构】示例附件.txt";
                    sensitive = false;
                    note = "【虚构】示例附件";
                    blob = sampleBlob("示例");
                  })) {
                    case (#ok _) attachmentCount += 1;
                    case (#err _) {};
                  };
                };
              };
              case (#err _) {};
            };
          };
        };

        AuditLib.log(state, caller, #seedSampleData, "示例数据", null, #success, null);
        #ok({
          alreadySeeded = false;
          companies = companyCount;
          records = recordCount;
          attachments = attachmentCount;
        });
      };
    };
  };
};
