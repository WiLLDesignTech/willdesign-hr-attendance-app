import { useTranslation } from "react-i18next";
import { Card, PageLayout, SectionTitle, TextMuted, FormField } from "../../theme/primitives";

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "ne", label: "नेपाली" },
] as const;

export function SettingsPage() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <PageLayout>
      <Card>
        <SectionTitle>Profile</SectionTitle>
        <TextMuted>Profile information loaded from your account</TextMuted>
      </Card>

      <Card>
        <SectionTitle>Preferences</SectionTitle>
        <FormField>
          <label htmlFor="settings-language">Language</label>
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
    </PageLayout>
  );
}
