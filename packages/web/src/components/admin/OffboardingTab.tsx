import { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, Modal, Badge, ButtonDanger, ButtonSecondary, FormField } from "../ui";
import { useEmployees, useOffboard } from "../../hooks/queries";
import { useToast } from "../ui/Toast";
import { TerminationTypes, EmployeeStatuses } from "@hr-attendance-app/types";

export const OffboardingTab = () => {
  const { t } = useTranslation();
  const { data: employees } = useEmployees();
  const offboard = useOffboard();
  const toast = useToast();

  const [selectedId, setSelectedId] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [terminationType, setTerminationType] = useState<string>(TerminationTypes.WITHOUT_CAUSE);
  const [lastWorkingDate, setLastWorkingDate] = useState("");
  const [exitNotes, setExitNotes] = useState("");
  const [noticeBuyout, setNoticeBuyout] = useState(false);
  const [curePeriodDate, setCurePeriodDate] = useState("");

  const activeEmployees = employees?.filter((e) => e.status === EmployeeStatuses.ACTIVE) ?? [];
  const selected = activeEmployees.find((e) => e.id === selectedId);

  const handleOffboard = () => {
    if (!selectedId) return;
    offboard.mutate(
      {
        employeeId: selectedId,
        terminationType,
        lastWorkingDate,
        exitNotes,
        noticePeriodBuyout: noticeBuyout,
        curePeriodDate: terminationType === TerminationTypes.FOR_CAUSE ? curePeriodDate : undefined,
      },
      {
        onSuccess: () => {
          toast.show(t("admin.offboardSuccess"), "success");
          setShowPreview(false);
          setSelectedId("");
        },
        onError: (err) => toast.show(err.message, "danger"),
      },
    );
  };

  return (
    <>
      <Card>
        <FormSection>
          <FormField>
            <label htmlFor="offboard-employee">{t("admin.offboard.selectEmployee")}</label>
            <select
              id="offboard-employee"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">{t("common.select")}</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {t(`team.employmentType.${emp.employmentType}`)}
                </option>
              ))}
            </select>
          </FormField>

          {selected && (
            <>
              <EmployeeInfo>
                <InfoRow>
                  <InfoLabel>{t("admin.offboard.employee")}:</InfoLabel>
                  <span>{selected.name}</span>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>{t("admin.offboard.type")}:</InfoLabel>
                  <Badge label={t(`team.employmentType.${selected.employmentType}`)} variant="info" />
                </InfoRow>
                <InfoRow>
                  <InfoLabel>{t("admin.offboard.region")}:</InfoLabel>
                  <Badge label={t(`team.region.${selected.region}`)} variant="info" />
                </InfoRow>
              </EmployeeInfo>

              <FormField>
                <label htmlFor="terminationType">{t("admin.offboard.terminationType")}</label>
                <select
                  id="terminationType"
                  value={terminationType}
                  onChange={(e) => setTerminationType(e.target.value)}
                >
                  <option value={TerminationTypes.WITHOUT_CAUSE}>{t("admin.offboard.withoutCause")}</option>
                  <option value={TerminationTypes.FOR_CAUSE}>{t("admin.offboard.forCause")}</option>
                  <option value={TerminationTypes.MUTUAL}>{t("admin.offboard.mutual")}</option>
                  <option value={TerminationTypes.RESIGNATION}>{t("admin.offboard.resignation")}</option>
                </select>
              </FormField>

              {terminationType === TerminationTypes.FOR_CAUSE && (
                <FormField>
                  <label htmlFor="curePeriodDate">{t("admin.offboard.curePeriod")}</label>
                  <input
                    id="curePeriodDate"
                    type="date"
                    value={curePeriodDate}
                    onChange={(e) => setCurePeriodDate(e.target.value)}
                  />
                </FormField>
              )}

              <FormField>
                <label htmlFor="lastWorkingDate">{t("admin.offboard.lastDate")}</label>
                <input
                  id="lastWorkingDate"
                  type="date"
                  value={lastWorkingDate}
                  onChange={(e) => setLastWorkingDate(e.target.value)}
                />
              </FormField>

              <FormField>
                <label htmlFor="exitNotes">{t("admin.offboard.notes")}</label>
                <textarea
                  id="exitNotes"
                  rows={3}
                  value={exitNotes}
                  onChange={(e) => setExitNotes(e.target.value)}
                />
              </FormField>

              <CheckboxRow>
                <input
                  type="checkbox"
                  id="noticeBuyout"
                  checked={noticeBuyout}
                  onChange={(e) => setNoticeBuyout(e.target.checked)}
                />
                <label htmlFor="noticeBuyout">{t("admin.offboard.noticeBuyout")}</label>
              </CheckboxRow>

              <ButtonDanger onClick={() => setShowPreview(true)}>
                {t("admin.offboard.preview")}
              </ButtonDanger>
            </>
          )}
        </FormSection>
      </Card>

      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={t("admin.offboard.settlementPreview")}
        size="lg"
      >
        <PreviewContent>
          <PreviewRow>
            <PreviewLabel>{t("admin.offboard.employee")}:</PreviewLabel>
            <span>{selected?.name}</span>
          </PreviewRow>
          <PreviewRow>
            <PreviewLabel>{t("admin.offboard.terminationType")}:</PreviewLabel>
            <span>{terminationType}</span>
          </PreviewRow>
          <PreviewRow>
            <PreviewLabel>{t("admin.offboard.lastDate")}:</PreviewLabel>
            <span>{lastWorkingDate || "—"}</span>
          </PreviewRow>
          <PreviewRow>
            <PreviewLabel>{t("admin.offboard.noticeBuyout")}:</PreviewLabel>
            <Badge label={noticeBuyout ? t("common.yes") : t("common.no")} variant={noticeBuyout ? "warning" : "info"} />
          </PreviewRow>
          <PreviewDivider />
          <PreviewNote>{t("admin.offboard.settlementNote")}</PreviewNote>
          <ButtonRow>
            <ButtonSecondary onClick={() => setShowPreview(false)}>
              {t("common.cancel")}
            </ButtonSecondary>
            <ButtonDanger onClick={handleOffboard} disabled={offboard.isPending}>
              {offboard.isPending ? t("common.submitting") : t("admin.offboard.confirm")}
            </ButtonDanger>
          </ButtonRow>
        </PreviewContent>
      </Modal>
    </>
  );
};

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;


const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const EmployeeInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const InfoLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const PreviewContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const PreviewRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const PreviewLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  min-width: 140px;
`;

const PreviewDivider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const PreviewNote = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: ${({ theme }) => theme.lineHeights.normal};
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space.sm};
`;
