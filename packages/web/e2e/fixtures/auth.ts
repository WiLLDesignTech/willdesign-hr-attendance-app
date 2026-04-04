import { test as base, type Page, type BrowserContext } from "@playwright/test";

const API_BASE = "http://localhost:3001";
const AUTH_STORAGE_KEY = "hr-app-auth";
const LANGUAGE_STORAGE_KEY = "hr-app-language";

interface AuthFixture {
  readonly page: Page;
  readonly context: BrowserContext;
}

const createAuthFixture = (employeeId: string) => {
  return async (
    { browser }: { browser: import("@playwright/test").Browser },
    use: (fixture: AuthFixture) => Promise<void>,
  ) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Call dev auth API to get a real token
    const response = await page.request.post(`${API_BASE}/api/dev-auth/login`, {
      data: { employeeId },
    });
    const data = (await response.json()) as {
      token: string;
      employee: { id: string; role: string };
    };

    const token = data.token;
    const role = data.employee.role;

    // Inject auth into sessionStorage and language into localStorage before page loads
    await page.addInitScript(
      ({ storageKey, langKey, authData }: { storageKey: string; langKey: string; authData: string }) => {
        sessionStorage.setItem(storageKey, authData);
        localStorage.setItem(langKey, "en");
      },
      {
        storageKey: AUTH_STORAGE_KEY,
        langKey: LANGUAGE_STORAGE_KEY,
        authData: JSON.stringify({ token, employeeId, role }),
      },
    );

    // Navigate to dashboard
    await page.goto("/dashboard");

    await use({ page, context });

    await context.close();
  };
};

export const test = base.extend<{
  employeePage: AuthFixture;
  managerPage: AuthFixture;
  adminPage: AuthFixture;
  employeeNPPage: AuthFixture;
}>({
  employeePage: createAuthFixture("JP001"),
  managerPage: createAuthFixture("MGR001"),
  adminPage: createAuthFixture("ADMIN001"),
  employeeNPPage: createAuthFixture("NP001"),
});

export { expect } from "@playwright/test";
