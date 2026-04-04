import type { Page, Locator } from "@playwright/test";

export class AdminPage {
  readonly page: Page;
  readonly selectSectionMessage: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.selectSectionMessage = page.getByText("Select a section to manage");
    this.backButton = page.getByRole("button", { name: "Back" }).or(page.getByLabel("Back"));
  }

  goto = async () => {
    await this.page.goto("/admin");
  };

  // Section navigation
  sectionButton = (label: string) =>
    this.page.getByRole("button", { name: label }).first();

  navButton = (sectionId: string) =>
    this.page.locator(`button[data-id="${sectionId}"]`).first();

  openSection = async (sectionId: string) => {
    await this.navButton(sectionId).click();
  };

  // ─── Onboarding ───
  onboardingSteps = () => this.page.getByText(/Personal Info|Employment|Salary/);
  nameInput = () => this.page.getByLabel("Full Name");
  emailInput = () => this.page.getByLabel("Email");
  slackIdInput = () => this.page.getByLabel("Slack User ID");
  employmentTypeSelect = () => this.page.getByLabel("Employment Type");
  regionSelect = () => this.page.getByLabel("Region");
  joinDateInput = () => this.page.getByLabel("Join Date");
  salaryInput = () => this.page.getByLabel("Salary Amount");
  currencySelect = () => this.page.getByLabel("Currency");
  nextButton = () => this.page.getByRole("button", { name: "Next" });
  submitButton = () => this.page.getByRole("button", { name: "Submit" });

  // ─── Offboarding ───
  offboardEmployeeSelect = () => this.page.getByLabel("Select Employee").or(this.page.getByLabel("Employee"));
  terminationTypeSelect = () => this.page.getByLabel("Termination Type");
  lastDateInput = () => this.page.getByLabel("Last Working Date");
  confirmButton = () => this.page.getByRole("button", { name: "Confirm Offboarding" });
  settlementPreview = () => this.page.getByText("Settlement Preview");

  // ─── Policies ───
  policyGroups = () => this.page.getByText(/Policy Groups|Hours|Leave|Overtime|Compensation|Probation|Flags|Payment|Report|Salary Statement/);

  // ─── Roles ───
  rolesList = () => this.page.getByText(/SUPER_ADMIN|MANAGER|EMPLOYEE/);
  lockedBadge = () => this.page.getByText("Locked");
  permissionCheckboxes = () => this.page.locator('input[type="checkbox"]');

  // ─── Holidays ───
  addHolidayButton = () => this.page.getByRole("button", { name: "Add Holiday" });
  holidayDateInput = () => this.page.getByLabel("Date");
  holidayNameInput = () => this.page.getByLabel("Name (EN)");
  deleteHolidayButtons = () => this.page.getByRole("button", { name: "Delete" });

  // ─── Attendance Lock ───
  lockButtons = () => this.page.getByRole("button", { name: /Lock Period|Unlock Period|Lock All/ });
  lockScopeCompany = () => this.page.getByText("Company");
  lockScopeGroup = () => this.page.getByText("Group");
  lockScopeEmployee = () => this.page.getByText("Employee");
}
