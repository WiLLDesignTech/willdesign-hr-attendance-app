import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useAuth } from "../../hooks/useAuth";
import { ButtonAccent } from "../ui/primitives";
import { LanguageSwitcher } from "../common/LanguageSwitcher";
import { API_DEV_AUTH_EMPLOYEES, API_DEV_AUTH_LOGIN, ROUTES } from "@hr-attendance-app/types";

interface DevEmployee {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly region: string;
}

const IS_DEV = import.meta.env.DEV;

export const LoginPage = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"prod" | "dev">(IS_DEV ? "dev" : "prod");

  // Prod mode state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Dev mode state
  const [employees, setEmployees] = useState<DevEmployee[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode !== "dev" || !IS_DEV) return;
    fetch(API_DEV_AUTH_EMPLOYEES)
      .then((res) => res.json())
      .then((data: unknown) => {
        if (!Array.isArray(data)) return;
        setEmployees(data as DevEmployee[]);
        if (data.length > 0) setSelectedId((data as DevEmployee[])[0]!.id);
      })
      .catch(console.error);
  }, [mode]);

  const handleDevLogin = useCallback(async () => {
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
  }, [selectedId, login, navigate]);

  const handleProdLogin = useCallback(async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      // TODO: Replace with real auth endpoint (Cognito, etc.)
      // For now, simulate a failed login in prod mode
      await new Promise((resolve) => setTimeout(resolve, 800));
      setError(t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  }, [email, password, t]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "dev") {
      void handleDevLogin();
    } else {
      void handleProdLogin();
    }
  }, [mode, handleDevLogin, handleProdLogin]);

  const selectedEmployee = employees.find((e) => e.id === selectedId);

  return (
    <LoginContainer>
      <TopBar>
        <LanguageSwitcher />
      </TopBar>
      <LoginCard>
        <LogoSection>
          <AccentDot aria-hidden />
          <Logo>{t("app.title")}</Logo>
        </LogoSection>

        <WelcomeText>{t("auth.welcomeBack")}</WelcomeText>
        <Subtitle>{t("auth.signInSubtitle")}</Subtitle>

        {IS_DEV && (
          <ModeSwitcher>
            <ModeButton $active={mode === "prod"} onClick={() => setMode("prod")}>
              {t("auth.prodMode")}
            </ModeButton>
            <ModeButton $active={mode === "dev"} onClick={() => setMode("dev")}>
              {t("auth.devMode")}
            </ModeButton>
          </ModeSwitcher>
        )}

        <Form onSubmit={handleSubmit}>
          {mode === "prod" ? (
            <>
              <FieldGroup>
                <Label htmlFor="login-email">{t("auth.email")}</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </FieldGroup>
              <FieldGroup>
                <LabelRow>
                  <Label htmlFor="login-password">{t("auth.password")}</Label>
                  <ForgotLink href="#">{t("auth.forgotPassword")}</ForgotLink>
                </LabelRow>
                <Input
                  id="login-password"
                  type="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </FieldGroup>
              {error && <ErrorText>{error}</ErrorText>}
            </>
          ) : (
            <>
              <FieldGroup>
                <Label htmlFor="dev-employee">{t("auth.selectEmployee")}</Label>
                <Select
                  id="dev-employee"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              {selectedEmployee && (
                <EmployeeInfo>
                  <InfoChip>{selectedEmployee.region}</InfoChip>
                  <InfoChip>{selectedEmployee.email}</InfoChip>
                </EmployeeInfo>
              )}
            </>
          )}

          <SubmitButton type="submit" disabled={loading || (mode === "dev" && !selectedId)}>
            {loading ? t("auth.loading") : t("auth.loginButton")}
          </SubmitButton>
        </Form>
      </LoginCard>
    </LoginContainer>
  );
};

/* ── Styled Components ── */

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.space.md};
`;

const TopBar = styled.div`
  position: fixed;
  top: ${({ theme }) => theme.space.md};
  right: ${({ theme }) => theme.space.md};
`;

const LoginCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space.xxl};
  max-width: 420px;
  width: 100%;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space.sm};
  margin-bottom: ${({ theme }) => theme.space.xl};
`;

const AccentDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.accent};
`;

const Logo = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
`;

const WelcomeText = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.space.xs};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.space.lg};
`;

const ModeSwitcher = styled.div`
  display: flex;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 3px;
  margin-bottom: ${({ theme }) => theme.space.lg};
`;

const ModeButton = styled.button<{ readonly $active: boolean }>`
  flex: 1;
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.md};
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  min-height: 36px;
  transition: all ${({ theme }) => theme.transition};
  background: ${({ $active, theme }) => $active ? theme.colors.surface : "transparent"};
  color: ${({ $active, theme }) => $active ? theme.colors.text : theme.colors.textMuted};
  box-shadow: ${({ $active, theme }) => $active ? theme.shadows.sm : "none"};

  &:focus-visible {
    box-shadow: ${({ theme }) => theme.focusRing};
    outline: none;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
`;

const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ForgotLink = styled.a`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.hover};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: ${({ theme }) => theme.fonts.body};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.background};
  min-height: 44px;
  transition: border-color ${({ theme }) => theme.transition};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.selected};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: ${({ theme }) => theme.fonts.body};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.background};
  min-height: 44px;
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transition};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.selected};
  }
`;

const EmployeeInfo = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.sm};
  justify-content: center;
`;

const InfoChip = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.selected};
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.radii.full};
`;

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.error};
  text-align: center;
`;

const SubmitButton = styled(ButtonAccent)`
  width: 100%;
  min-height: 48px;
  font-size: ${({ theme }) => theme.fontSizes.base};
  margin-top: ${({ theme }) => theme.space.xs};
`;
