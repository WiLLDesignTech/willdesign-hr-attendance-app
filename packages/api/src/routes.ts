/**
 * Aggregates all route definitions from handler modules.
 */
import type { RouteDefinition } from "./handlers/router.js";
import type { DepsResolver } from "./composition.js";
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

export function buildRoutes(getDeps: DepsResolver): readonly RouteDefinition[] {
  return [
    ...employeeRoutes(getDeps),
    ...attendanceRoutes(getDeps),
    ...leaveRoutes(getDeps),
    ...payrollRoutes(getDeps),
    ...flagRoutes(getDeps),
    ...bankRoutes(getDeps),
    ...reportRoutes(getDeps),
    ...adminRoutes(getDeps),
    ...holidayRoutes(getDeps),
    ...policyRoutes(getDeps),
    ...attendanceLockRoutes(getDeps),
  ];
}
