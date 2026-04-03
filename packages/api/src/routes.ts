/**
 * Aggregates all route definitions from handler modules.
 */
import type { RouteDefinition } from "./handlers/router.js";
import type { AppDeps } from "./composition.js";
import { employeeRoutes } from "./handlers/employees.js";
import { attendanceRoutes } from "./handlers/attendance.js";
import { leaveRoutes } from "./handlers/leave.js";
import { payrollRoutes } from "./handlers/payroll.js";
import { flagRoutes } from "./handlers/flags.js";
import { bankRoutes } from "./handlers/bank.js";
import { reportRoutes } from "./handlers/reports.js";
import { adminRoutes } from "./handlers/admin.js";
import { holidayRoutes } from "./handlers/holidays.js";
import { policyRoutes } from "./handlers/policies.js";
import { attendanceLockRoutes } from "./handlers/attendance-lock.js";

export function buildRoutes(deps: AppDeps): readonly RouteDefinition[] {
  return [
    ...employeeRoutes(deps),
    ...attendanceRoutes(deps),
    ...leaveRoutes(deps),
    ...payrollRoutes(deps),
    ...flagRoutes(deps),
    ...bankRoutes(deps),
    ...reportRoutes(deps),
    ...adminRoutes(deps),
    ...holidayRoutes(deps),
    ...policyRoutes(deps),
    ...attendanceLockRoutes(deps),
  ];
}
