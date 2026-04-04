import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Tabs, Badge, ButtonAccent, ButtonDanger, DataTable, Card } from "../ui";
import { useAttendanceLocks, useCreateLock, useDeleteLock, useEmployees } from "../../hooks/queries";
import { useToast } from "../ui/Toast";
import { AttendanceLockScopes, isoToYearMonth, nowIso } from "@hr-attendance-app/types";
import type { ColumnDef } from "@tanstack/react-table";

type LockScope = "company" | "group" | "employee";

const SCOPE_TABS = [
  { key: "company" as const, label: "admin.lock.company" },
  { key: "group" as const, label: "admin.lock.group" },
  { key: "employee" as const, label: "admin.lock.employee" },
];

const EMPLOYMENT_GROUPS = [
  "jp-fulltime", "jp-contract", "jp-gyoumu-itaku", "jp-parttime",
  "jp-sales", "jp-intern", "np-fulltime", "np-paid-intern", "np-unpaid-intern",
] as const;

export const AttendanceLockTab = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [yearMonth, setYearMonth] = useState(() => isoToYearMonth(nowIso()));
  const [scope, setScope] = useState<LockScope>("company");

  const { data: locks, isLoading } = useAttendanceLocks(yearMonth);
  const { data: employees } = useEmployees();
  const createLock = useCreateLock();
  const deleteLock = useDeleteLock();

  const companyLock = locks?.find((l) => l.scope === AttendanceLockScopes.COMPANY);
  const isCompanyLocked = !!companyLock;

  const handleCompanyToggle = useCallback(() => {
    if (isCompanyLocked) {
      deleteLock.mutate({ scope: AttendanceLockScopes.COMPANY, yearMonth }, {
        onSuccess: () => toast.show(t("admin.lock.unlocked"), "success"),
      });
    } else {
      createLock.mutate({ scope: AttendanceLockScopes.COMPANY, yearMonth }, {
        onSuccess: () => toast.show(t("admin.lock.locked"), "success"),
      });
    }
  }, [isCompanyLocked, yearMonth, createLock, deleteLock, toast, t]);

  const handleGroupToggle = useCallback((groupId: string) => {
    const locked = locks?.some((l) => l.scope === AttendanceLockScopes.GROUP && l.groupId === groupId);
    if (locked) {
      deleteLock.mutate({ scope: AttendanceLockScopes.GROUP, yearMonth, groupId });
    } else {
      createLock.mutate({ scope: AttendanceLockScopes.GROUP, yearMonth, groupId });
    }
  }, [locks, yearMonth, createLock, deleteLock]);

  const handleEmployeeToggle = useCallback((employeeId: string) => {
    const locked = locks?.some((l) => l.scope === AttendanceLockScopes.EMPLOYEE && l.employeeId === employeeId);
    if (locked) {
      deleteLock.mutate({ scope: AttendanceLockScopes.EMPLOYEE, yearMonth, employeeId });
    } else {
      createLock.mutate({ scope: AttendanceLockScopes.EMPLOYEE, yearMonth, employeeId });
    }
  }, [locks, yearMonth, createLock, deleteLock]);

  const handleLockAll = useCallback(() => {
    if (scope === "group") {
      EMPLOYMENT_GROUPS.forEach((groupId) => {
        createLock.mutate({ scope: AttendanceLockScopes.GROUP, yearMonth, groupId });
      });
    } else if (scope === "employee") {
      employees?.forEach((emp) => {
        createLock.mutate({ scope: AttendanceLockScopes.EMPLOYEE, yearMonth, employeeId: emp.id });
      });
    }
    toast.show(t("admin.lock.allLocked"), "success");
  }, [scope, yearMonth, employees, createLock, toast, t]);

  const groupColumns: ColumnDef<string, unknown>[] = [
    { accessorFn: (g) => g, header: t("admin.lock.groupName"), cell: ({ getValue }) => getValue() as string },
    {
      id: "status",
      header: t("admin.lock.status"),
      cell: ({ row }) => {
        const locked = locks?.some((l) => l.scope === AttendanceLockScopes.GROUP && l.groupId === row.original);
        return <Badge label={locked ? t("admin.lock.locked") : t("admin.lock.unlocked")} variant={locked ? "danger" : "success"} />;
      },
    },
    {
      id: "action",
      header: "",
      cell: ({ row }) => {
        const locked = locks?.some((l) => l.scope === AttendanceLockScopes.GROUP && l.groupId === row.original);
        return locked
          ? <SmallButton onClick={() => handleGroupToggle(row.original)}>{t("admin.lock.unlock")}</SmallButton>
          : <SmallButton onClick={() => handleGroupToggle(row.original)}>{t("admin.lock.lock")}</SmallButton>;
      },
    },
  ];

  const employeeColumns: ColumnDef<{ id: string; name: string }, unknown>[] = [
    { accessorKey: "name", header: t("admin.lock.employeeName") },
    {
      id: "status",
      header: t("admin.lock.status"),
      cell: ({ row }) => {
        const locked = locks?.some((l) => l.scope === AttendanceLockScopes.EMPLOYEE && l.employeeId === row.original.id);
        return <Badge label={locked ? t("admin.lock.locked") : t("admin.lock.unlocked")} variant={locked ? "danger" : "success"} />;
      },
    },
    {
      id: "action",
      header: "",
      cell: ({ row }) => {
        const locked = locks?.some((l) => l.scope === AttendanceLockScopes.EMPLOYEE && l.employeeId === row.original.id);
        return locked
          ? <SmallButton onClick={() => handleEmployeeToggle(row.original.id)}>{t("admin.lock.unlock")}</SmallButton>
          : <SmallButton onClick={() => handleEmployeeToggle(row.original.id)}>{t("admin.lock.lock")}</SmallButton>;
      },
    },
  ];

  const localizedScopeTabs = SCOPE_TABS.map((st) => ({ key: st.key, label: t(st.label) }));

  return (
    <LockContainer>
      <ControlRow>
        <MonthInput
          type="month"
          value={yearMonth}
          onChange={(e) => setYearMonth(e.target.value)}
        />
        {scope !== "company" && (
          <ButtonAccent onClick={handleLockAll} disabled={createLock.isPending}>
            {t("admin.lock.lockAll")}
          </ButtonAccent>
        )}
      </ControlRow>

      <Tabs tabs={localizedScopeTabs} activeKey={scope} onChange={(k) => setScope(k as LockScope)} />

      {isLoading ? (
        <Card><p>{t("common.loading")}</p></Card>
      ) : scope === "company" ? (
        <CompanySection>
          <StatusRow>
            <Badge label={isCompanyLocked ? t("admin.lock.locked") : t("admin.lock.unlocked")} variant={isCompanyLocked ? "danger" : "success"} />
          </StatusRow>
          {isCompanyLocked ? (
            <ButtonDanger onClick={handleCompanyToggle} disabled={deleteLock.isPending}>
              {t("admin.lock.unlock")}
            </ButtonDanger>
          ) : (
            <ButtonAccent onClick={handleCompanyToggle} disabled={createLock.isPending}>
              {t("admin.lock.lock")}
            </ButtonAccent>
          )}
        </CompanySection>
      ) : scope === "group" ? (
        <DataTable
          data={[...EMPLOYMENT_GROUPS]}
          columns={groupColumns}
          searchable
          searchPlaceholder={t("common.search")}
          emptyMessage={t("common.noData")}
        />
      ) : (
        <DataTable
          data={(employees ?? []).map((e) => ({ id: e.id, name: e.name }))}
          columns={employeeColumns}
          searchable
          searchPlaceholder={t("common.search")}
          emptyMessage={t("common.noData")}
        />
      )}
    </LockContainer>
  );
};

const LockContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  flex-wrap: wrap;
`;

const MonthInput = styled.input`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: ${({ theme }) => theme.fonts.body};
  min-height: 44px;
`;

const CompanySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
  align-items: flex-start;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const SmallButton = styled.button`
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.background};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition};
  min-height: 44px;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }
`;
