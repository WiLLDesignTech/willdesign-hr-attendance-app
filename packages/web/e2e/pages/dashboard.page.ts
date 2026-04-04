import type { Page, Locator } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly clockWidget: Locator;
  readonly clockInButton: Locator;
  readonly clockOutButton: Locator;
  readonly breakButton: Locator;
  readonly backFromBreakButton: Locator;
  readonly elapsedTimer: Locator;
  readonly hoursToday: Locator;
  readonly hoursWeek: Locator;
  readonly hoursMonth: Locator;
  readonly leaveBalance: Locator;
  readonly newLeaveLink: Locator;
  readonly viewReportsLink: Locator;
  readonly viewPayrollLink: Locator;
  readonly viewTeamLink: Locator;
  readonly upcomingHolidays: Locator;

  constructor(page: Page) {
    this.page = page;
    this.clockWidget = page.getByTestId("clock-widget");
    this.clockInButton = page.getByRole("button", { name: "Clock In" });
    this.clockOutButton = page.getByRole("button", { name: "Clock Out" });
    this.breakButton = page.getByRole("button", { name: "Break" });
    this.backFromBreakButton = page.getByRole("button", { name: "Back" });
    this.elapsedTimer = page.locator("span").filter({ hasText: /^\d+:\d{2}:\d{2}$/ });
    this.hoursToday = page.getByText("Hours Today");
    this.hoursWeek = page.getByText("This Week");
    this.hoursMonth = page.getByText("This Month");
    this.leaveBalance = page.getByText("Leave Balance");
    this.newLeaveLink = page.getByRole("link", { name: "New Leave Request" });
    this.viewReportsLink = page.getByRole("link", { name: "View Reports" });
    this.viewPayrollLink = page.getByRole("link", { name: "View Payroll" });
    this.viewTeamLink = page.getByRole("link", { name: "View Team" });
    this.upcomingHolidays = page.getByText("Upcoming Holidays");
  }

  goto = async () => {
    await this.page.goto("/dashboard");
  };

  clockIn = async () => {
    await this.clockInButton.click();
    await this.page.waitForResponse((res) =>
      res.url().includes("/api/attendance/events") && res.status() === 200,
    );
  };

  clockOut = async () => {
    await this.clockOutButton.click();
    await this.page.waitForResponse((res) =>
      res.url().includes("/api/attendance/events") && res.status() === 200,
    );
  };

  startBreak = async () => {
    await this.breakButton.click();
    await this.page.waitForResponse((res) =>
      res.url().includes("/api/attendance/events") && res.status() === 200,
    );
  };

  endBreak = async () => {
    await this.backFromBreakButton.click();
    await this.page.waitForResponse((res) =>
      res.url().includes("/api/attendance/events") && res.status() === 200,
    );
  };

  leaveBalanceValue = () => this.page.locator("div").filter({ hasText: /^\d+ days$/ }).first();

  statsCards = () => this.page.getByText(/Hours Today|This Week|This Month|Leave Balance/);
}
