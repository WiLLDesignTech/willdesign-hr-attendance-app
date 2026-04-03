import type { RawPolicy } from "@hr-attendance-app/types";
import { deepMergePolicy } from "../../resolver.js";
import { npBasePolicy } from "./np-base.js";

/** Nepal paid intern — 80h/mo, inherits NP base. */
export const npPaidInternPolicy: RawPolicy = deepMergePolicy(npBasePolicy, {
  hours: { monthlyMinimum: 80 },
});
