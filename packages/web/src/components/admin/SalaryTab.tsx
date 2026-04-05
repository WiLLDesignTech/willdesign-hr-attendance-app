import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, Badge, FormField, ButtonAccent, ButtonSecondary, Modal, EmptyState } from "../ui";
import { useToast } from "../ui/Toast";
import { useEmployees, useSalaryHistory, useAddSalaryEntry } from "../../hooks/queries";
import { SalaryTypes, SalaryChangeTypes, Currencies } from "@hr-attendance-app/types";
import type { Employee, SalaryRecord } from "@hr-attendance-app/types";
import { formatDate } from "../../utils/date";

const CHANGE_TYPE_OPTIONS = [
  SalaryChangeTypes.INITIAL,
  SalaryChangeTypes.PROBATION_END,
  SalaryChangeTypes.REVIEW,
  SalaryChangeTypes.PROMOTION,
  SalaryChangeTypes.ADJUSTMENT,
] as const;

export const SalaryTab = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: employees } = useEmployees();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: history, isLoading } = useSalaryHistory(selectedEmployee?.id ?? "");
  const addEntry = useAddSalaryEntry();

  const [formAmount, setFormAmount] = useState("");
  const [formCurrency, setFormCurrency] = useState(Currencies.JPY);
  const [formSalaryType, setFormSalaryType] = useState(SalaryTypes.MONTHLY);
  const [formChangeType, setFormChangeType] = useState(SalaryChangeTypes.REVIEW);
  const [formEffectiveFrom, setFormEffectiveFrom] = useState("");

  const handleAdd = useCallback(() => {
    if (!selectedEmployee || !formAmount || !formEffectiveFrom) return;
    addEntry.mutate(
      {
        employeeId: selectedEmployee.id,
        amount: Number(formAmount),
        currency: formCurrency,
        salaryType: formSalaryType,
        changeType: formChangeType,
        effectiveFrom: formEffectiveFrom,
      },
      {
        onSuccess: () => {
          toast.show(t("admin.salary.added"), "success");
          setShowAddModal(false);
          setFormAmount("");
          setFormEffectiveFrom("");
        },
        onError: (err) => toast.show(err.message, "danger"),
      },
    );
  }, [selectedEmployee, formAmount, formCurrency, formSalaryType, formChangeType, formEffectiveFrom, addEntry, toast, t]);

  return (
    <>
      <EmployeeSelector>
        <FormField>
          <label htmlFor="salary-employee">{t("admin.salary.selectEmployee")}</label>
          <select
            id="salary-employee"
            value={selectedEmployee?.id ?? ""}
            onChange={(e) => {
              const emp = employees?.find((em) => em.id === e.target.value) ?? null;
              setSelectedEmployee(emp);
            }}
          >
            <option value="">{t("common.select")}</option>
            {employees?.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </FormField>
      </EmployeeSelector>

      {selectedEmployee && (
        <Card>
          <SectionHeader>
            <SectionTitle>{t("admin.salary.history")} — {selectedEmployee.name}</SectionTitle>
            <ButtonAccent onClick={() => setShowAddModal(true)}>
              {t("admin.salary.addEntry")}
            </ButtonAccent>
          </SectionHeader>

          {isLoading && <p>{t("common.loading")}</p>}
          {!isLoading && (!history || history.length === 0) && (
            <EmptyState message={t("admin.salary.noHistory")} />
          )}
          {!isLoading && history && history.length > 0 && (
            <HistoryList>
              {history.map((entry: SalaryRecord) => (
                <HistoryRow key={entry.id}>
                  <HistoryMain>
                    <HistoryAmount>
                      {entry.currency} {entry.amount.toLocaleString()}
                    </HistoryAmount>
                    <HistoryMeta>
                      {t(`admin.salary.type.${entry.salaryType}`)} · {t(`admin.salary.change.${entry.changeType}`)}
                    </HistoryMeta>
                  </HistoryMain>
                  <HistoryRight>
                    <Badge label={formatDate(entry.effectiveFrom)} variant="info" />
                    <Badge label={t(`admin.salary.change.${entry.changeType}`)} variant="success" />
                  </HistoryRight>
                </HistoryRow>
              ))}
            </HistoryList>
          )}
        </Card>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t("admin.salary.addEntry")}
      >
        <EditForm>
          <FormField>
            <label htmlFor="salary-amount">{t("admin.salary.amount")}</label>
            <input id="salary-amount" type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
          </FormField>
          <FormField>
            <label htmlFor="salary-currency">{t("admin.onboard.currency")}</label>
            <select id="salary-currency" value={formCurrency} onChange={(e) => setFormCurrency(e.target.value as typeof formCurrency)}>
              <option value={Currencies.JPY}>JPY</option>
              <option value={Currencies.NPR}>NPR</option>
            </select>
          </FormField>
          <FormField>
            <label htmlFor="salary-type">{t("admin.onboard.salaryType")}</label>
            <select id="salary-type" value={formSalaryType} onChange={(e) => setFormSalaryType(e.target.value as typeof formSalaryType)}>
              <option value={SalaryTypes.MONTHLY}>{t("admin.onboard.monthly")}</option>
              <option value={SalaryTypes.ANNUAL}>{t("admin.onboard.annual")}</option>
              <option value={SalaryTypes.HOURLY}>{t("admin.onboard.hourly")}</option>
            </select>
          </FormField>
          <FormField>
            <label htmlFor="salary-change-type">{t("admin.salary.changeType")}</label>
            <select id="salary-change-type" value={formChangeType} onChange={(e) => setFormChangeType(e.target.value as typeof formChangeType)}>
              {CHANGE_TYPE_OPTIONS.map((ct) => (
                <option key={ct} value={ct}>{t(`admin.salary.change.${ct}`)}</option>
              ))}
            </select>
          </FormField>
          <FormField>
            <label htmlFor="salary-effective">{t("admin.salary.effectiveFrom")}</label>
            <input id="salary-effective" type="date" value={formEffectiveFrom} onChange={(e) => setFormEffectiveFrom(e.target.value)} />
          </FormField>
          <ButtonRow>
            <ButtonSecondary onClick={() => setShowAddModal(false)}>{t("common.cancel")}</ButtonSecondary>
            <ButtonAccent onClick={handleAdd} disabled={!formAmount || !formEffectiveFrom || addEntry.isPending}>
              {addEntry.isPending ? t("common.submitting") : t("common.submit")}
            </ButtonAccent>
          </ButtonRow>
        </EditForm>
      </Modal>
    </>
  );
};

const EmployeeSelector = styled.div`
  max-width: 300px;
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space.md};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;

const HistoryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.space.sm};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const HistoryMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const HistoryAmount = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: ${({ theme }) => theme.fonts.mono};
`;

const HistoryMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const HistoryRight = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.xs};
  flex-wrap: wrap;
`;

const EditForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space.sm};
`;
