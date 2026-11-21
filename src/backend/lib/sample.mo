import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Common "../types/common";
import State "../types/state";
import Records "../types/records";
import Attachments "../types/attachments";
import Audit "../types/audit";
import Opportunities "../types/opportunities";
import Sample "../types/sample";
import Errors "../types/errors";
import Access "access";
import AuditLib "audit";
import RecordsLib "records";
import CompaniesLib "companies";
import Companies "../types/companies";
import PermissionsLib "permissions";
import AttachmentsLib "attachments";
import OpportunitiesLib "opportunities";

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
          return #ok({ alreadySeeded = true; companies = 0; records = 0; attachments = 0; opportunities = 0; checkItems = 0 });
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
        let recordIds = List.empty<Common.RecordId>();

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
                recordIds.add(view.id);
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

        // ── 【虚构】招标公告与资格核对结论 ─────────────────────────────────────
        var opportunityCount = 0;
        var checkItemCount = 0;

        let firstCompany = switch (companyIds.get(0)) { case (?c) ?c; case null null };
        let secondCompany = switch (companyIds.get(1)) { case (?c) ?c; case null null };
        let verifiedRecord = switch (recordIds.get(0)) { case (?r) ?r; case null null };
        let pendingRecord = switch (recordIds.get(1)) { case (?r) ?r; case null null };

        let opportunityInputs : [(Opportunities.OpportunityInput, Opportunities.OpportunityStatus)] = [
          // 已截止
          (
            {
              projectName = "【虚构】城东片区市政道路改造工程";
              tenderer = "【虚构】某市城市建设投资集团";
              projectType = #construction;
              sourceName = "【虚构】某省公共资源交易网";
              sourceUrl = "https://example.invalid/notice/2026-0001";
              publishDate = today - 40 * DAY_NS;
              registrationDeadline = today - 10 * DAY_NS;
              bidOpenTime = today - 3 * DAY_NS;
              budgetYuan = ?12_000_000;
              body = "【虚构】一、项目概况\n本工程为城东片区市政道路改造，全长约 3.2 公里。\n\n二、资格要求\n1. 具备市政公用工程施工总承包二级及以上资质；\n2. 近三年具有类似市政道路工程业绩不少于 2 项；\n3. 拟派项目经理须具备市政公用工程专业二级及以上注册建造师证书。\n\n三、保证金要求\n投标保证金人民币 20 万元。";
              clauses = [
                { kind = #qualification; excerpt = "具备市政公用工程施工总承包二级及以上资质" },
                { kind = #performance; excerpt = "近三年具有类似市政道路工程业绩不少于 2 项" },
                { kind = #personnel; excerpt = "拟派项目经理须具备市政公用工程专业二级及以上注册建造师证书" },
                { kind = #deposit; excerpt = "投标保证金人民币 20 万元" },
              ];
            },
            #closed,
          ),
          // 待核对
          (
            {
              projectName = "【虚构】某区智慧园区设备采购项目";
              tenderer = "【虚构】某区科技发展有限公司";
              projectType = #goodsEquipment;
              sourceName = "【虚构】某市政府采购网";
              sourceUrl = "https://example.invalid/notice/2026-0002";
              publishDate = today - 5 * DAY_NS;
              registrationDeadline = today + 5 * DAY_NS;
              bidOpenTime = today + 8 * DAY_NS;
              budgetYuan = ?3_500_000;
              body = "【虚构】一、采购内容\n智慧园区安防与网络设备一批。\n\n二、资格要求\n1. 具有独立法人资格，注册资本不低于人民币 500 万元；\n2. 近三年具有类似设备供货业绩不少于 1 项；\n3. 具备有效的安全生产许可。\n\n三、保证金要求\n投标保证金人民币 5 万元。";
              clauses = [
                { kind = #qualification; excerpt = "具有独立法人资格，注册资本不低于人民币 500 万元" },
                { kind = #performance; excerpt = "近三年具有类似设备供货业绩不少于 1 项" },
                { kind = #deposit; excerpt = "投标保证金人民币 5 万元" },
              ];
            },
            #pendingReview,
          ),
          // 已选公司参投
          (
            {
              projectName = "【虚构】某医院后勤物业服务项目";
              tenderer = "【虚构】某市第一人民医院";
              projectType = #service;
              sourceName = "【虚构】某省公共资源交易网";
              sourceUrl = "https://example.invalid/notice/2026-0003";
              publishDate = today - 3 * DAY_NS;
              registrationDeadline = today + 6 * DAY_NS;
              bidOpenTime = today + 9 * DAY_NS;
              budgetYuan = ?1_800_000;
              body = "【虚构】一、服务内容\n医院后勤保洁、绿化与设备维护服务，服务期 2 年。\n\n二、资格要求\n1. 具备有效的营业执照与安全生产许可；\n2. 近三年具有类似物业服务业绩不少于 1 项；\n3. 拟派项目负责人须具备物业管理相关证书。\n\n三、保证金要求\n投标保证金人民币 3 万元。";
              clauses = [
                { kind = #qualification; excerpt = "具备有效的营业执照与安全生产许可" },
                { kind = #performance; excerpt = "近三年具有类似物业服务业绩不少于 1 项" },
                { kind = #personnel; excerpt = "拟派项目负责人须具备物业管理相关证书" },
                { kind = #deposit; excerpt = "投标保证金人民币 3 万元" },
              ];
            },
            #selected,
          ),
        ];

        let createdOpportunities = List.empty<Common.OpportunityId>();
        for ((input, targetStatus) in opportunityInputs.values()) {
          switch (OpportunitiesLib.createDraft(state, caller, input)) {
            case (#ok draftView) {
              switch (OpportunitiesLib.submit(state, caller, draftView.id)) {
                case (#ok _) {
                  opportunityCount += 1;
                  createdOpportunities.add(draftView.id);
                  if (targetStatus != #pendingReview) {
                    switch (OpportunitiesLib.changeStatus(state, caller, draftView.id, targetStatus, "【虚构】示例数据状态")) {
                      case (#ok _) {};
                      case (#err _) {};
                    };
                  };
                };
                case (#err _) {};
              };
            };
            case (#err _) {};
          };
        };

        // 资格核对结论：覆盖 符合 / 不符合 / 待核，引用已有示例公司档案。
        let checkItemInputs : [Opportunities.CheckItemInput] = [
          {
            opportunityId = switch (createdOpportunities.get(1)) { case (?o) o; case null 0 };
            companyId = firstCompany ?? 0;
            kind = #qualification;
            clauseExcerpt = "具有独立法人资格，注册资本不低于人民币 500 万元";
            conclusion = #conform;
            basis = "【虚构】公司注册资本满足要求，营业执照有效。";
            evidence = switch (verifiedRecord) { case (?r) [{ recordId = r; statusAtCitation = #verified }]; case null [] };
          },
          {
            opportunityId = switch (createdOpportunities.get(1)) { case (?o) o; case null 0 };
            companyId = firstCompany ?? 0;
            kind = #performance;
            clauseExcerpt = "近三年具有类似设备供货业绩不少于 1 项";
            conclusion = #pending;
            basis = "【虚构】类似业绩资料待补充，暂无法判定。";
            evidence = switch (pendingRecord) { case (?r) [{ recordId = r; statusAtCitation = #pendingReview }]; case null [] };
          },
          {
            opportunityId = switch (createdOpportunities.get(2)) { case (?o) o; case null 0 };
            companyId = secondCompany ?? 0;
            kind = #qualification;
            clauseExcerpt = "具备有效的营业执照与安全生产许可";
            conclusion = #conform;
            basis = "【虚构】营业执照与安全生产许可均在有效期内。";
            evidence = switch (verifiedRecord) { case (?r) [{ recordId = r; statusAtCitation = #verified }]; case null [] };
          },
          {
            opportunityId = switch (createdOpportunities.get(2)) { case (?o) o; case null 0 };
            companyId = secondCompany ?? 0;
            kind = #personnel;
            clauseExcerpt = "拟派项目负责人须具备物业管理相关证书";
            conclusion = #nonConform;
            basis = "【虚构】拟派项目负责人暂无物业管理相关证书。";
            evidence = [];
          },
        ];

        for (input in checkItemInputs.values()) {
          if (input.opportunityId != 0) {
            switch (OpportunitiesLib.createCheckItem(state, caller, input)) {
              case (#ok _) checkItemCount += 1;
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
          opportunities = opportunityCount;
          checkItems = checkItemCount;
        });
      };
    };
  };
};
