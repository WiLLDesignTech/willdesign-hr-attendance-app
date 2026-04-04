import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, Calendar, Modal, Badge, ButtonAccent, ButtonDanger, ButtonSecondary, Tabs, EmptyState, FormField } from "../ui";
import { useHolidays, useCreateHoliday, useDeleteHoliday } from "../../hooks/queries";
import { useToast } from "../ui/Toast";
import { Regions, currentYear } from "@hr-attendance-app/types";

export const HolidayTab = () => {
  const { t } = useTranslation();
  const toast = useToast();

  const [region, setRegion] = useState<string>(Regions.JP);
  const [year] = useState(() => currentYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ region: string; date: string; name: string } | null>(null);

  const { data: holidays, isLoading } = useHolidays(region, year);
  const createHoliday = useCreateHoliday();
  const deleteHoliday = useDeleteHoliday();

  // Form state
  const [formDate, setFormDate] = useState("");
  const [formName, setFormName] = useState("");
  const [formNameJa, setFormNameJa] = useState("");
  const [formSubstitute, setFormSubstitute] = useState(false);

  const highlightedDates = useMemo(() => {
    if (!holidays) return new Set<string>();
    return new Set(holidays.map((h) => h.date));
  }, [holidays]);

  const handleAdd = useCallback(() => {
    createHoliday.mutate(
      { date: formDate, name: formName, nameJa: formNameJa || undefined, region, isSubstitute: formSubstitute },
      {
        onSuccess: () => {
          toast.show(t("admin.holiday.added"), "success");
          setShowAddModal(false);
          setFormDate("");
          setFormName("");
          setFormNameJa("");
          setFormSubstitute(false);
        },
        onError: (err) => toast.show(err.message, "danger"),
      },
    );
  }, [createHoliday, formDate, formName, formNameJa, region, formSubstitute, toast, t]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteHoliday.mutate(
      { region: deleteTarget.region, date: deleteTarget.date },
      {
        onSuccess: () => {
          toast.show(t("admin.holiday.deleted"), "success");
          setDeleteTarget(null);
        },
        onError: (err) => toast.show(err.message, "danger"),
      },
    );
  }, [deleteHoliday, deleteTarget, toast, t]);

  const regionTabs = [
    { key: Regions.JP, label: t("team.region.JP") },
    { key: Regions.NP, label: t("team.region.NP") },
  ];

  return (
    <>
      <HeaderRow>
        <Tabs tabs={regionTabs} activeKey={region} onChange={setRegion} />
        <ButtonAccent onClick={() => setShowAddModal(true)}>
          {t("admin.holiday.add")}
        </ButtonAccent>
      </HeaderRow>

      {isLoading ? (
        <Card><p>{t("common.loading")}</p></Card>
      ) : (
        <>
          <CalendarCard>
            <Calendar highlightedDates={highlightedDates} />
          </CalendarCard>

          <HolidayList>
            {!holidays?.length ? (
              <EmptyState message={t("admin.holiday.none")} />
            ) : (
              holidays.map((h) => (
                <HolidayRow key={`${h.region}-${h.date}`}>
                  <HolidayInfo>
                    <HolidayDate>{h.date}</HolidayDate>
                    <HolidayName>{h.name}</HolidayName>
                    {h.isSubstitute && <Badge label={t("admin.holiday.substitute")} variant="info" />}
                  </HolidayInfo>
                  <ButtonDanger
                    onClick={() => setDeleteTarget({ region: h.region, date: h.date, name: h.name })}
                  >
                    {t("common.delete")}
                  </ButtonDanger>
                </HolidayRow>
              ))
            )}
          </HolidayList>
        </>
      )}

      {/* Add Holiday Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={t("admin.holiday.add")}>
        <ModalForm>
          <FormField>
            <label htmlFor="holiday-date">{t("admin.holiday.date")}</label>
            <input id="holiday-date" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
          </FormField>
          <FormField>
            <label htmlFor="holiday-name">{t("admin.holiday.name")}</label>
            <input id="holiday-name" value={formName} onChange={(e) => setFormName(e.target.value)} />
          </FormField>
          <FormField>
            <label htmlFor="holiday-nameJa">{t("admin.holiday.nameJa")}</label>
            <input id="holiday-nameJa" value={formNameJa} onChange={(e) => setFormNameJa(e.target.value)} />
          </FormField>
          <CheckboxRow>
            <input type="checkbox" id="holiday-sub" checked={formSubstitute} onChange={(e) => setFormSubstitute(e.target.checked)} />
            <label htmlFor="holiday-sub">{t("admin.holiday.substitute")}</label>
          </CheckboxRow>
          <ButtonRow>
            <ButtonSecondary onClick={() => setShowAddModal(false)}>{t("common.cancel")}</ButtonSecondary>
            <ButtonAccent onClick={handleAdd} disabled={!formDate || !formName || createHoliday.isPending}>
              {createHoliday.isPending ? t("common.submitting") : t("common.submit")}
            </ButtonAccent>
          </ButtonRow>
        </ModalForm>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t("admin.holiday.deleteConfirm")} size="sm">
        <ModalForm>
          <p>{t("admin.holiday.deleteMessage", { name: deleteTarget?.name })}</p>
          <ButtonRow>
            <ButtonSecondary onClick={() => setDeleteTarget(null)}>{t("common.cancel")}</ButtonSecondary>
            <ButtonDanger onClick={handleDelete} disabled={deleteHoliday.isPending}>
              {deleteHoliday.isPending ? t("common.submitting") : t("common.delete")}
            </ButtonDanger>
          </ButtonRow>
        </ModalForm>
      </Modal>
    </>
  );
};

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  flex-wrap: wrap;
`;

const CalendarCard = styled(Card)`
  margin-top: ${({ theme }) => theme.space.md};
`;

const HolidayList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  margin-top: ${({ theme }) => theme.space.md};
`;

const HolidayRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.sm};
  gap: ${({ theme }) => theme.space.md};
`;

const HolidayInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  flex-wrap: wrap;
`;

const HolidayDate = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.mono};
`;

const HolidayName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ModalForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;


const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space.sm};
`;
