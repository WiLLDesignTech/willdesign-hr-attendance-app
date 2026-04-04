import type { Page, Locator } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly loginButton: Locator;
  readonly getStartedButton: Locator;
  readonly heroTitle: Locator;
  readonly heroSubtitle: Locator;
  readonly appTitle: Locator;
  readonly featuresSection: Locator;
  readonly deploySection: Locator;
  readonly footer: Locator;
  readonly languageSwitcher: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginButton = page.getByRole("button", { name: "Log In" });
    this.getStartedButton = page.getByRole("button", { name: "Get Started" });
    this.heroTitle = page.getByRole("heading", { name: "Streamline Your HR Operations" });
    this.heroSubtitle = page.getByText("Attendance tracking, leave management");
    this.appTitle = page.getByText("HR Attendance App").first();
    this.featuresSection = page.getByRole("heading", { name: "Everything You Need" });
    this.deploySection = page.getByRole("heading", { name: "Flexible Deployment" });
    this.footer = page.getByText("Built for modern HR teams.");
    this.languageSwitcher = page.locator("select").first();
  }

  goto = async () => {
    await this.page.goto("/");
  };

  featureCards = () => this.page.locator("h3");

  deployCards = () => this.page.getByText(/Cloud Hosted|Self-Hosted/);
}
