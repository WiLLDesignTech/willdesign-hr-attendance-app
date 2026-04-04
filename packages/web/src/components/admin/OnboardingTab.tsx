import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import styled from "styled-components";
import { FormWizard, Card, FormField } from "../ui";
import { useOnboard } from "../../hooks/queries";
import { useEmployees } from "../../hooks/queries";
import { useToast } from "../ui/Toast";
import { EmploymentTypes, Regions, SalaryTypes, Currencies } from "@hr-attendance-app/types";
import type { FieldValues } from "react-hook-form";

const personalSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  slackId: z.string().min(1),
  languagePreference: z.enum(["en", "ja", "ne"]),
});

const employmentSchema = z.object({
  employmentType: z.string().min(1),
  region: z.enum(["JP", "NP"]),
  managerId: z.string().min(1),
  joinDate: z.string().min(1),
});

const salarySchema = z.object({
  salaryAmount: z.coerce.number().positive(),
  currency: z.enum(["JPY", "NPR"]),
  salaryType: z.enum(["MONTHLY", "ANNUAL", "HOURLY"]),
});

const EMPLOYMENT_TYPE_OPTIONS = [
  EmploymentTypes.JP_FULL_TIME,
  EmploymentTypes.JP_CONTRACT,
  EmploymentTypes.JP_OUTSOURCED,
  EmploymentTypes.JP_PART_TIME,
  EmploymentTypes.JP_SALES,
  EmploymentTypes.JP_INTERN,
  EmploymentTypes.NP_FULL_TIME,
  EmploymentTypes.NP_PAID_INTERN,
  EmploymentTypes.NP_UNPAID_INTERN,
] as const;

export const OnboardingTab = () => {
  const { t } = useTranslation();
  const onboard = useOnboard();
  const { data: employees } = useEmployees();
  const toast = useToast();

  const handleSubmit = (data: Record<string, unknown>) => {
    onboard.mutate(data, {
      onSuccess: () => toast.show(t("admin.onboardSuccess"), "success"),
      onError: (err) => toast.show(err.message, "danger"),
    });
  };

  const steps = useMemo(() => [
    {
      label: t("admin.onboard.step1"),
      schema: personalSchema,
      fields: ["name", "email", "slackId", "languagePreference"] as const,
      render: (form: { register: FieldValues["register"] }) => (
        <FormGrid>
          <FormField>
            <label htmlFor="name">{t("admin.onboard.name")}</label>
            <input id="name" {...form.register("name")} />
          </FormField>
          <FormField>
            <label htmlFor="email">{t("admin.onboard.email")}</label>
            <input id="email" type="email" {...form.register("email")} />
          </FormField>
          <FormField>
            <label htmlFor="slackId">{t("admin.onboard.slackId")}</label>
            <input id="slackId" {...form.register("slackId")} />
          </FormField>
          <FormField>
            <label htmlFor="languagePreference">{t("admin.onboard.language")}</label>
            <select id="languagePreference" {...form.register("languagePreference")}>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="ne">नेपाली</option>
            </select>
          </FormField>
        </FormGrid>
      ),
    },
    {
      label: t("admin.onboard.step2"),
      schema: employmentSchema,
      fields: ["employmentType", "region", "managerId", "joinDate"] as const,
      render: (form: { register: FieldValues["register"] }) => (
        <FormGrid>
          <FormField>
            <label htmlFor="employmentType">{t("admin.onboard.employmentType")}</label>
            <select id="employmentType" {...form.register("employmentType")}>
              <option value="">{t("common.select")}</option>
              {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {t(`team.employmentType.${type}`)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField>
            <label htmlFor="region">{t("admin.onboard.region")}</label>
            <select id="region" {...form.register("region")}>
              <option value={Regions.JP}>{t("team.region.JP")}</option>
              <option value={Regions.NP}>{t("team.region.NP")}</option>
            </select>
          </FormField>
          <FormField>
            <label htmlFor="managerId">{t("admin.onboard.manager")}</label>
            <select id="managerId" {...form.register("managerId")}>
              <option value="">{t("common.select")}</option>
              {employees?.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField>
            <label htmlFor="joinDate">{t("admin.onboard.joinDate")}</label>
            <input id="joinDate" type="date" {...form.register("joinDate")} />
          </FormField>
        </FormGrid>
      ),
    },
    {
      label: t("admin.onboard.step3"),
      schema: salarySchema,
      fields: ["salaryAmount", "currency", "salaryType"] as const,
      render: (form: { register: FieldValues["register"] }) => (
        <FormGrid>
          <FormField>
            <label htmlFor="salaryAmount">{t("admin.onboard.salary")}</label>
            <input id="salaryAmount" type="number" {...form.register("salaryAmount")} />
          </FormField>
          <FormField>
            <label htmlFor="currency">{t("admin.onboard.currency")}</label>
            <select id="currency" {...form.register("currency")}>
              <option value={Currencies.JPY}>JPY</option>
              <option value={Currencies.NPR}>NPR</option>
            </select>
          </FormField>
          <FormField>
            <label htmlFor="salaryType">{t("admin.onboard.salaryType")}</label>
            <select id="salaryType" {...form.register("salaryType")}>
              <option value={SalaryTypes.MONTHLY}>{t("admin.onboard.monthly")}</option>
              <option value={SalaryTypes.ANNUAL}>{t("admin.onboard.annual")}</option>
              <option value={SalaryTypes.HOURLY}>{t("admin.onboard.hourly")}</option>
            </select>
          </FormField>
        </FormGrid>
      ),
    },
  ], [t, employees]);

  return (
    <Card>
      <FormWizard
        steps={steps}
        onSubmit={handleSubmit}
        isSubmitting={onboard.isPending}
      />
    </Card>
  );
};

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

