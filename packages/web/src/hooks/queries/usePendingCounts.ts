import { useMemo } from "react";
import { FlagStatuses, BankApprovalStatuses } from "@hr-attendance-app/types";
import { usePendingLeaveRequests } from "./useLeave";
import { useFlags } from "./useFlags";
import { useBank } from "./useBank";

export const usePendingCounts = () => {
  const { data: pendingLeave } = usePendingLeaveRequests({ enabled: true });
  const { data: flags } = useFlags();
  const { data: bankEntries } = useBank();

  return useMemo(() => {
    const leave = pendingLeave?.length ?? 0;
    const flag = flags?.filter((f) => f.status === FlagStatuses.PENDING).length ?? 0;
    const bank = bankEntries?.filter((b) => b.approvalStatus === BankApprovalStatuses.PENDING).length ?? 0;
    return { leave, flag, bank, total: leave + flag + bank };
  }, [pendingLeave, flags, bankEntries]);
};
