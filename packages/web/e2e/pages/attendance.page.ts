import type { Page, Locator } from "@playwright/test";

export class AttendancePage {
  readonly page: Page;
  readonly clockWidget: Locator;
  readonly calendarHeading: Locator;
  readonly lockedBadge: Locator;
  readonly lockedNotice: Locator;
  readonly dayDetailHeading: Locator;
  readonly noRecordsMessage: Locator;
  readonly editModal: Locator;
  readonly editReasonInput: Locator;
  readonly editSubmitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.clockWidget = page.getByTestId("clock-widget");
    this.calendarHeading = page.getByRole("heading", { name: "Monthly Calendar" });
    this.lockedBadge = page.getByText("Locked");
    this.lockedNotice = page.getByText("This period is locked by admin");
    this.dayDetailHeading = page.getByRole("heading", { name: /Details for/ });
    this.noRecordsMessage = page.getByText("No attendance records yet");
    this.editModal = page.getByRole("heading", { name: "Edit Event" });
    this.editReasonInput = page.locator("#edit-reason");
    this.editSubmitButton = page.getByRole("button", { name: "Submit" });
  }

  goto = async () => {
    await this.page.goto("/attendance");
  };

  editButtons = () => this.page.getByRole("button", { name: "Edit" });

  timelineItems = () => this.page.locator("[class*='TimelineItem']");

  actionBadges = () => this.page.getByText(/Clock In|Clock Out|Break Start|Break End/);
}
