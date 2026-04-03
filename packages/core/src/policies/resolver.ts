import type { RawPolicy } from "@hr-attendance-app/types";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

function deepMergePlain(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const key of Object.keys(override)) {
    const baseVal = base[key];
    const overrideVal = override[key];

    if (overrideVal === undefined) {
      continue;
    }

    if (isPlainObject(baseVal) && isPlainObject(overrideVal)) {
      result[key] = deepMergePlain(baseVal, overrideVal);
    } else {
      result[key] = overrideVal;
    }
  }

  return result;
}

/**
 * Deep-merges two RawPolicy objects. Override wins field-by-field.
 * Arrays are REPLACED entirely (not appended).
 */
export function deepMergePolicy(base: RawPolicy, override: RawPolicy): RawPolicy {
  return deepMergePlain(
    base as Record<string, unknown>,
    override as Record<string, unknown>,
  ) as RawPolicy;
}

function isEffective(policy: RawPolicy, referenceDate?: Date): boolean {
  if (!policy.effectiveFrom) return true;
  if (!referenceDate) return true;
  return new Date(policy.effectiveFrom) <= referenceDate;
}

/**
 * 3-level cascade: company → group → employee.
 * Null layers are skipped. effectiveFrom filtering applied per layer.
 */
export function resolveCascade(
  company: RawPolicy,
  group: RawPolicy | null,
  user: RawPolicy | null,
  referenceDate?: Date,
): RawPolicy {
  // Company is always the base — effectiveFrom filtering only applies to override layers
  let result = company;

  if (group && isEffective(group, referenceDate)) {
    result = deepMergePolicy(result, group);
  }

  if (user && isEffective(user, referenceDate)) {
    result = deepMergePolicy(result, user);
  }

  return result;
}
