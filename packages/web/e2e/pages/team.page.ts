import type { Page, Locator } from "@playwright/test";

export class TeamPage {
  readonly page: Page;
  readonly overviewTab: Locator;
  readonly approvalsTab: Locator;
  readonly calendarTab: Locator;
  readonly reportsTab: Locator;
  readonly noMembersMessage: Locator;
  readonly noApprovalsMessage: Locator;
  readonly noLeaveMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.overviewTab = page.getByText("Overview", { exact: true });
    this.approvalsTab = page.getByText("Approvals", { exact: true });
    this.calendarTab = page.getByText("Calendar", { exact: true });
    this.reportsTab = page.getByText("Reports", { exact: true });
    this.noMembersMessage = page.getByText("No team members loaded");
    this.noApprovalsMessage = page.getByText("No pending approvals");
    this.noLeaveMessage = page.getByText("No approved leave this month");
  }

  goto = async () => {
    await this.page.goto("/team");
  };

  memberCards = () => this.page.locator("[class*='MemberCard']");

  memberNames = () => this.page.locator("[class*='MemberName']");

  flagResolveSelects = () => this.page.locator("[class*='ResolveSelect']");

  approveButtons = () => this.page.getByRole("button", { name: "Approve" });

  reportDateInput = () => this.page.locator("#report-date");
}
