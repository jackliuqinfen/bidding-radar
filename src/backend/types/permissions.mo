import Common "common";

module {
  /// One user's permissions on one company; labels use exactly 查看/编辑/核实/敏感下载.
  public type CompanyPermissionGrant = {
    companyId : Common.CompanyId;
    companyName : Text;
    permissions : Common.PermissionSet;
    permissionLabels : [Text];
  };

  public type UserPermissions = {
    user : Principal;
    displayName : Text;
    grants : [CompanyPermissionGrant];
  };
};
