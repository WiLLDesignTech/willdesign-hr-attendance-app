import type { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly logo: Locator;
  readonly welcomeText: Locator;
  readonly subtitle: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly forgotPasswordLink: Locator;
  readonly submitButton: Locator;
  readonly prodModeButton: Locator;
  readonly devModeButton: Locator;
  readonly employeeSelect: Locator;
  readonly errorText: Locator;
  readonly languageSwitcher: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.getByText("HR Attendance App");
    this.welcomeText = page.getByRole("heading", { name: "Welcome back" });
    this.subtitle = page.getByText("Sign in to your account to continue");
    this.emailInput = page.locator("#login-email");
    this.passwordInput = page.locator("#login-password");
    this.forgotPasswordLink = page.getByText("Forgot password?");
    this.submitButton = page.getByRole("button", { name: "Log In" });
    this.prodModeButton = page.getByRole("button", { name: "Sign In" });
    this.devModeButton = page.getByRole("button", { name: "Dev Mode" });
    this.employeeSelect = page.locator("#dev-employee");
    this.errorText = page.getByText("Invalid email or password");
    this.languageSwitcher = page.locator("select").first();
  }

  goto = async () => {
    await this.page.goto("/login");
  };

  loginAsDev = async (employeeId: string) => {
    await this.employeeSelect.selectOption(employeeId);
    await this.submitButton.click();
    await this.page.waitForURL("**/dashboard");
  };

  attemptProdLogin = async (email: string, password: string) => {
    await this.prodModeButton.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  };

  infoChips = () => this.page.locator("span").filter({ hasText: /^(JP|NP|.*@example\.com)$/ });
}
