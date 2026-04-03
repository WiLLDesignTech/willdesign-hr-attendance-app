import { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Button, TextMuted } from "../../theme/primitives";
import { useAttendanceLocks, useCreateLock, useDeleteLock } from "../../hooks/queries";
import { AttendanceLockScopes, isoToYearMonth, nowIso } from "@hr-attendance-app/types";

const LockContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const MonthPickerRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
`;

const MonthInput = styled.input`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 0.875rem;
  min-height: 44px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const StatusBadge = styled.span<{ $locked: boolean }>`
  display: inline-block;
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ $locked, theme }) => $locked ? theme.colors.error : theme.colors.success};
  color: ${({ theme }) => theme.colors.background};
  font-size: 0.75rem;
  font-weight: 600;
`;

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.875rem;
`;

export function AttendanceLockTab() {
  const { t } = useTranslation();
  const [yearMonth, setYearMonth] = useState(() => isoToYearMonth(nowIso()));

  const { data: locks, isLoading } = useAttendanceLocks(yearMonth);
  const createLock = useCreateLock();
  const deleteLock = useDeleteLock();

  const companyLock = locks?.find(l => l.scope === AttendanceLockScopes.COMPANY);
  const isLocked = !!companyLock;

  const handleLock = () => {
    createLock.mutate({ scope: AttendanceLockScopes.COMPANY, yearMonth });
  };

  const handleUnlock = () => {
    deleteLock.mutate({ scope: AttendanceLockScopes.COMPANY, yearMonth });
  };

  return (
    <LockContainer>
      <MonthPickerRow>
        <MonthInput
          type="month"
          value={yearMonth}
          onChange={(e) => setYearMonth(e.target.value)}
        />
      </MonthPickerRow>

      <StatusRow>
        <TextMuted>{t("admin.lock.status")}:</TextMuted>
        {isLoading ? (
          <TextMuted>{t("common.loading")}</TextMuted>
        ) : (
          <StatusBadge $locked={isLocked}>
            {isLocked ? t("admin.lock.locked") : t("admin.lock.unlocked")}
          </StatusBadge>
        )}
      </StatusRow>

      {isLocked ? (
        <Button onClick={handleUnlock} disabled={deleteLock.isPending}>
          {t("admin.lock.unlock")}
        </Button>
      ) : (
        <Button onClick={handleLock} disabled={createLock.isPending}>
          {t("admin.lock.lock")}
        </Button>
      )}

      {createLock.isError && (
        <ErrorText>{createLock.error.message}</ErrorText>
      )}
      {deleteLock.isError && (
        <ErrorText>{deleteLock.error.message}</ErrorText>
      )}
    </LockContainer>
  );
}
