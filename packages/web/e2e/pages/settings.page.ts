import type { Page, Locator } from "@playwright/test";

export class SettingsPage {
  readonly page: Page;
  readonly profileHeading: Locator;
  readonly nameField: Locator;
  readonly emailField: Locator;
  readonly employmentTypeField: Locator;
  readonly regionField: Locator;
  readonly languageSelect: Locator;
  readonly pushNotifToggle: Locator;
  readonly emailNotifToggle: Locator;
  readonly probationBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.profileHeading = page.getByRole("heading", { name: "Profile" });
    this.nameField = page.getByText("Name").first();
    this.emailField = page.getByText("Email").first();
    this.employmentTypeField = page.getByText("Employment Type").first();
    this.regionField = page.getByText("Region").first();
    this.languageSelect = page.locator("#settings-language");
    this.pushNotifToggle = page.locator("#push-notifs");
    this.emailNotifToggle = page.locator("#email-notifs");
    this.probationBadge = page.getByText("Ends on");
  }

  goto = async () => {
    await this.page.goto("/settings");
  };

  changeLanguage = async (langCode: string) => {
    await this.languageSelect.selectOption(langCode);
  };

  profileValues = () => this.page.locator("[class*='FieldValue']");
}
