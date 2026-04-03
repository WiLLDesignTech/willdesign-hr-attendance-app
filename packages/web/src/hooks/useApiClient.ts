import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { createApiClient } from "./apiClient";

/**
 * Hook that returns a memoized API client bound to the current auth token.
 */
export function useApiClient() {
  const { token } = useAuth();
  return useMemo(() => createApiClient(() => token), [token]);
}
