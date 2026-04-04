import type { Page, Locator } from "@playwright/test";

export class LeavePage {
  readonly page: Page;
  readonly myLeaveTab: Locator;
  readonly calendarTab: Locator;
  readonly balanceTab: Locator;
  readonly leaveTypeSelect: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly submitButton: Locator;
  readonly noRequestsMessage: Locator;
  readonly zeroBalanceWarning: Locator;
  readonly pendingApprovalsHeading: Locator;
  readonly paidRemaining: Locator;
  readonly carryOver: Locator;
  readonly mandatory5Days: Locator;

  constructor(page: Page) {
    this.page = page;
    this.myLeaveTab = page.getByRole("tab", { name: "My Leave" }).or(page.getByText("My Leave"));
    this.calendarTab = page.getByRole("tab", { name: "Team Calendar" }).or(page.getByText("Team Calendar"));
    this.balanceTab = page.getByRole("tab", { name: "Balance" }).or(page.getByText("Balance"));
    this.leaveTypeSelect = page.locator("#leave-type");
    this.startDateInput = page.locator("#start-date");
    this.endDateInput = page.locator("#end-date");
    this.submitButton = page.getByRole("button", { name: "Submit Request" });
    this.noRequestsMessage = page.getByText("No leave requests");
    this.zeroBalanceWarning = page.getByText("Your paid leave balance is zero");
    this.pendingApprovalsHeading = page.getByRole("heading", { name: "Pending Approvals" });
    this.paidRemaining = page.getByText("Paid Leave Remaining");
    this.carryOver = page.getByText("Carry Over");
    this.mandatory5Days = page.getByText("Mandatory 5-Day Usage");
  }

  goto = async () => {
    await this.page.goto("/leave");
  };

  submitLeaveRequest = async (type: string, startDate: string, endDate: string) => {
    await this.leaveTypeSelect.selectOption(type);
    await this.startDateInput.fill(startDate);
    await this.endDateInput.fill(endDate);
    await this.submitButton.click();
    await this.page.waitForResponse((res) =>
      res.url().includes("/api/leave-requests") && res.request().method() === "POST",
    );
  };

  requestRows = () => this.page.locator("[class*='RequestRow']");

  approveButtons = () => this.page.getByRole("button", { name: "Approve" });

  statusBadges = () => this.page.getByText(/Pending|Approved|Rejected/);
}
