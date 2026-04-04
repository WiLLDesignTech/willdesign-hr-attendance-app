import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Badge, FormField, DataTable } from "../ui";
import { useAudit } from "../../hooks/queries";
import { formatDateTime } from "../../utils/date";
import { AuditSources, AuditActions } from "@hr-attendance-app/types";
import type { AuditEntry } from "@hr-attendance-app/types";
import type { ColumnDef } from "@tanstack/react-table";

interface AuditPanelProps {
  readonly targetId: string;
}

const VARIANT_MAP: Record<string, "info" | "success" | "warning" | "danger"> = {
  slack: "info",
  web: "success",
  system: "warning",
  admin: "danger",
  cron: "info",
};

export function AuditPanel({ targetId }: AuditPanelProps) {
  const { t } = useTranslation();
  const { data: entries, isLoading } = useAudit(targetId);
  const [sourceFilter, setSourceFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const filtered = useMemo(() => {
    if (!entries) return [];
    return entries.filter((e) => {
      if (sourceFilter && e.source !== sourceFilter) return false;
      if (actionFilter && e.action !== actionFilter) return false;
      return true;
    });
  }, [entries, sourceFilter, actionFilter]);

  const columns: ColumnDef<AuditEntry, unknown>[] = useMemo(() => [
    {
      accessorKey: "timestamp",
      header: t("audit.timestamp"),
      cell: ({ getValue }) => formatDateTime(getValue() as string),
    },
    {
      accessorKey: "actorId",
      header: t("audit.actor"),
    },
    {
      accessorKey: "source",
      header: t("audit.source"),
      cell: ({ getValue }) => {
        const src = getValue() as string;
        return <Badge label={src} variant={VARIANT_MAP[src] ?? "info"} />;
      },
    },
    {
      accessorKey: "action",
      header: t("audit.action"),
      cell: ({ getValue }) => <Badge label={getValue() as string} variant="info" />,
    },
    {
      id: "changes",
      header: t("audit.changes"),
      cell: ({ row }) => {
        const entry = row.original;
        if (!entry.before && !entry.after) return <span>—</span>;
        return (
          <ChangeSummary>
            {entry.before && <ChangeLabel>{t("audit.before")}: {JSON.stringify(entry.before).slice(0, 60)}</ChangeLabel>}
            {entry.after && <ChangeLabel>{t("audit.after")}: {JSON.stringify(entry.after).slice(0, 60)}</ChangeLabel>}
          </ChangeSummary>
        );
      },
    },
  ], [t]);

  return (
    <AuditContainer>
      <FilterRow>
        <FormField>
          <label htmlFor="audit-source">{t("audit.filterSource")}</label>
          <select id="audit-source" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="">{t("audit.allSources")}</option>
            <option value={AuditSources.SLACK}>Slack</option>
            <option value={AuditSources.WEB}>Web</option>
            <option value={AuditSources.SYSTEM}>System</option>
            <option value={AuditSources.ADMIN}>Admin</option>
            <option value={AuditSources.CRON}>Cron</option>
          </select>
        </FormField>
        <FormField>
          <label htmlFor="audit-action">{t("audit.filterAction")}</label>
          <select id="audit-action" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">{t("audit.allActions")}</option>
            <option value={AuditActions.CREATE}>{t("audit.create")}</option>
            <option value={AuditActions.UPDATE}>{t("audit.update")}</option>
            <option value={AuditActions.DELETE}>{t("audit.deleteAction")}</option>
            <option value={AuditActions.APPROVE}>{t("audit.approve")}</option>
            <option value={AuditActions.REJECT}>{t("audit.reject")}</option>
            <option value={AuditActions.RESOLVE}>{t("audit.resolve")}</option>
          </select>
        </FormField>
      </FilterRow>

      <DataTable
        data={filtered}
        columns={columns}
        loading={isLoading}
        emptyMessage={t("audit.none")}
        pageSize={25}
      />
    </AuditContainer>
  );
}

const AuditContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const FilterRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.md};
  flex-wrap: wrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const ChangeSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-family: ${({ theme }) => theme.fonts.mono};
`;

const ChangeLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
`;
