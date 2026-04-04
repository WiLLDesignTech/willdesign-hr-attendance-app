import { Navigate, Outlet } from "react-router-dom";
import { Roles, ROUTES } from "@hr-attendance-app/types";
import { Permissions } from "@hr-attendance-app/types";
import type { Permission } from "@hr-attendance-app/types";
import { useHasMinimumRole, useHasPermission } from "../../hooks/useRole";

interface RoleGuardProps {
  readonly requiredPermission?: Permission;
  readonly minRole?: string;
}

/** Route guard that redirects to dashboard if user lacks the required permission or role. */
export const RoleGuard = ({ requiredPermission, minRole }: RoleGuardProps) => {
  const hasPermissionResult = useHasPermission(requiredPermission ?? Permissions.EMPLOYEE_LIST_ALL);
  const hasRoleResult = useHasMinimumRole(minRole ?? Roles.EMPLOYEE);

  const allowed =
    (!requiredPermission || hasPermissionResult) &&
    (!minRole || hasRoleResult);

  if (!allowed) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
};
