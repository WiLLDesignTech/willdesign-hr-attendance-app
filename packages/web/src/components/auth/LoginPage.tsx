import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useAuth } from "../../hooks/useAuth";
import { ButtonAccent } from "../../theme/primitives";
import { API_DEV_AUTH_EMPLOYEES, API_DEV_AUTH_LOGIN, ROUTES } from "@hr-attendance-app/types";

interface DevEmployee {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly region: string;
}

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`;

const LoginCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space.xxl};
  max-width: 400px;
  width: 100%;
  text-align: center;
`;

const Logo = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.5rem;
  margin-bottom: ${({ theme }) => theme.space.lg};
  span {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 1rem;
  margin-bottom: ${({ theme }) => theme.space.md};
  min-height: 44px;
`;

const RoleBadge = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-left: ${({ theme }) => theme.space.xs};
`;

export const LoginPage = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<DevEmployee[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(API_DEV_AUTH_EMPLOYEES)
      .then((res) => res.json())
      .then((data: DevEmployee[]) => {
        setEmployees(data);
        if (data.length > 0) setSelectedId(data[0]!.id);
      })
      .catch(console.error);
  }, []);

  const handleLogin = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch(API_DEV_AUTH_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedId }),
      });
      const data = (await res.json()) as {
        token: string;
        employee: { id: string; role: string };
      };
      login(data.token, data.employee.id, data.employee.role);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          {t("app.title")}
        </Logo>
        <p style={{ marginBottom: "16px", color: "#888" }}>
          {t("auth.selectEmployee")}
        </p>
        <Select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
              {` (${emp.role})`}
            </option>
          ))}
        </Select>
        {selectedId && (
          <RoleBadge>
            {employees.find((e) => e.id === selectedId)?.region ?? ""}
          </RoleBadge>
        )}
        <ButtonAccent
          onClick={handleLogin}
          disabled={loading || !selectedId}
          style={{ width: "100%", marginTop: "16px" }}
        >
          {loading ? t("auth.loading") : t("auth.loginButton")}
        </ButtonAccent>
      </LoginCard>
    </LoginContainer>
  );
};
