import { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, PageLayout, FormField, Badge } from "../ui";
import { useCurrentUser } from "../../hooks/queries";
import { formatDate } from "../../utils/date";

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "ne", label: "नेपाली" },
] as const;

export const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { data: user } = useCurrentUser();
  const [pushNotifs, setPushNotifs] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  return (
    <PageLayout>
      {/* Profile */}
      <Card>
        <SectionLabel>{t("settings.profile")}</SectionLabel>
        {user ? (
          <ProfileGrid>
            <ProfileField>
              <FieldLabel>{t("settings.name")}</FieldLabel>
              <FieldValue>{user.name}</FieldValue>
            </ProfileField>
            <ProfileField>
              <FieldLabel>{t("settings.email")}</FieldLabel>
              <FieldValue>{user.email}</FieldValue>
            </ProfileField>
            <ProfileField>
              <FieldLabel>{t("settings.employmentType")}</FieldLabel>
              <FieldValue>
                <Badge label={t(`team.employmentType.${user.employmentType}`)} variant="info" />
              </FieldValue>
            </ProfileField>
            <ProfileField>
              <FieldLabel>{t("settings.region")}</FieldLabel>
              <FieldValue>
                <Badge label={t(`team.region.${user.region}`)} variant="info" />
              </FieldValue>
            </ProfileField>
            {user.probationEndDate && (
              <ProfileField>
                <FieldLabel>{t("settings.probation")}</FieldLabel>
                <FieldValue>
                  <Badge label={`${t("settings.endsOn")} ${formatDate(user.probationEndDate)}`} variant="warning" />
                </FieldValue>
              </ProfileField>
            )}
          </ProfileGrid>
        ) : (
          <p>{t("common.loading")}</p>
        )}
      </Card>

      {/* Language */}
      <Card>
        <SectionLabel>{t("settings.language")}</SectionLabel>
        <FormField>
          <label htmlFor="settings-language">{t("settings.selectLanguage")}</label>
          <select
            id="settings-language"
            value={i18n.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </FormField>
      </Card>

      {/* Notifications */}
      <Card>
        <SectionLabel>{t("settings.notifications")}</SectionLabel>
        <ToggleRow>
          <ToggleLabel htmlFor="push-notifs">{t("settings.pushNotifications")}</ToggleLabel>
          <ToggleInput
            type="checkbox"
            id="push-notifs"
            checked={pushNotifs}
            onChange={(e) => setPushNotifs(e.target.checked)}
          />
        </ToggleRow>
        <ToggleRow>
          <ToggleLabel htmlFor="email-notifs">{t("settings.emailNotifications")}</ToggleLabel>
          <ToggleInput
            type="checkbox"
            id="email-notifs"
            checked={emailNotifs}
            onChange={(e) => setEmailNotifs(e.target.checked)}
          />
        </ToggleRow>
      </Card>
    </PageLayout>
  );
};

const SectionLabel = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.space.md};
`;

const ProfileField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const FieldLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const FieldValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  &:last-child { border-bottom: none; }
`;

const ToggleLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
`;

const ToggleInput = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: ${({ theme }) => theme.colors.accent};
`;
