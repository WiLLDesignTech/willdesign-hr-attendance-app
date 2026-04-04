import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, Badge, ButtonAccent, EmptyState } from "../ui";
import { useRoles, useUpdateRole } from "../../hooks/queries";
import { useToast } from "../ui/Toast";
import { Permissions } from "@hr-attendance-app/types";

const PERMISSION_GROUPS = [
  { domain: "attendance", permissions: [Permissions.ATTENDANCE_LOCK] },
  { domain: "leave", permissions: [Permissions.LEAVE_APPROVE] },
  { domain: "flags", permissions: [Permissions.FLAG_RESOLVE] },
  { domain: "bank", permissions: [Permissions.BANK_APPROVE] },
  { domain: "admin", permissions: [Permissions.ONBOARD, Permissions.OFFBOARD, Permissions.AUDIT_VIEW, Permissions.POLICY_UPDATE] },
  { domain: "employees", permissions: [Permissions.EMPLOYEE_LIST_ALL, Permissions.EMPLOYEE_UPDATE] },
  { domain: "holidays", permissions: [Permissions.HOLIDAY_MANAGE] },
] as const;

export function RolesTab() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: roles, isLoading } = useRoles();
  const updateRole = useUpdateRole();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [editPermissions, setEditPermissions] = useState<Set<string>>(new Set());

  const handleRoleSelect = useCallback((name: string) => {
    setSelectedRole(name);
    const role = roles?.find((r) => r.name === name);
    setEditPermissions(new Set(role?.permissions ?? []));
  }, [roles]);

  const handleToggle = useCallback((permission: string) => {
    setEditPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) {
        next.delete(permission);
      } else {
        next.add(permission);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedRole) return;
    updateRole.mutate(
      { name: selectedRole, description: "", permissions: [...editPermissions] },
      {
        onSuccess: () => toast.show(t("admin.rolesEditor.saved"), "success"),
        onError: (err) => toast.show(err.message, "danger"),
      },
    );
  }, [selectedRole, editPermissions, roles, updateRole, toast, t]);

  const isSuperAdmin = selectedRole === "SUPER_ADMIN";

  return (
    <RolesLayout>
      <RoleList>
        <RoleHeader>{t("admin.rolesEditor.list")}</RoleHeader>
        {isLoading ? (
          <p>{t("common.loading")}</p>
        ) : !roles?.length ? (
          <EmptyState message={t("admin.rolesEditor.none")} />
        ) : (
          roles.map((role) => (
            <RoleButton
              key={role.name}
              $active={selectedRole === role.name}
              onClick={() => handleRoleSelect(role.name)}
            >
              <RoleName>{role.name}</RoleName>
              <Badge label={`${role.permissions.length}`} variant="info" />
            </RoleButton>
          ))
        )}
      </RoleList>

      <PermissionPanel>
        {!selectedRole ? (
          <EmptyState message={t("admin.rolesEditor.selectRole")} />
        ) : (
          <Card>
            <PermissionTitle>
              {selectedRole}
              {isSuperAdmin && <Badge label={t("admin.rolesEditor.locked")} variant="warning" />}
            </PermissionTitle>

            {PERMISSION_GROUPS.map((group) => (
              <PermissionGroup key={group.domain}>
                <GroupLabel>{t(`admin.rolesEditor.domain.${group.domain}`)}</GroupLabel>
                {group.permissions.map((perm) => (
                  <PermissionRow key={perm}>
                    <Checkbox
                      type="checkbox"
                      checked={editPermissions.has(perm)}
                      disabled={isSuperAdmin}
                      onChange={() => handleToggle(perm)}
                      id={`perm-${perm}`}
                    />
                    <PermLabel htmlFor={`perm-${perm}`}>{perm}</PermLabel>
                  </PermissionRow>
                ))}
              </PermissionGroup>
            ))}

            {!isSuperAdmin && (
              <SaveRow>
                <ButtonAccent onClick={handleSave} disabled={updateRole.isPending}>
                  {updateRole.isPending ? t("common.submitting") : t("common.submit")}
                </ButtonAccent>
              </SaveRow>
            )}
          </Card>
        )}
      </PermissionPanel>
    </RolesLayout>
  );
}

const RolesLayout = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const RoleList = styled.div`
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
  }
`;

const RoleHeader = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.space.sm};
`;

const RoleButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: none;
  background: ${({ theme, $active }) => $active ? theme.colors.selected : "transparent"};
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  min-height: 44px;
  white-space: nowrap;
  transition: all ${({ theme }) => theme.transition};

  &:hover { background: ${({ theme }) => theme.colors.surfaceHover}; }
`;

const RoleName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const PermissionPanel = styled.div`
  flex: 1;
  min-width: 0;
`;

const PermissionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const PermissionGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const GroupLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.space.sm};
  padding-bottom: ${({ theme }) => theme.space.xs};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const PermissionRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.xs} 0;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: ${({ theme }) => theme.colors.accent};

  &:disabled { cursor: not-allowed; opacity: 0.5; }
`;

const PermLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  font-family: ${({ theme }) => theme.fonts.mono};
`;

const SaveRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.space.md};
`;
