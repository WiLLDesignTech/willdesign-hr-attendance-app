import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import type { AttendanceAction, AttendanceState } from "@hr-attendance-app/types";
import { AttendanceStates, AttendanceActions } from "@hr-attendance-app/types";
import { ButtonAccent, ButtonDanger, ButtonSecondary } from "../../theme/primitives";

interface ClockWidgetProps {
  readonly status: AttendanceState;
  readonly hoursToday: number;
  readonly onAction: (action: AttendanceAction) => void;
  readonly loading?: boolean;
}

const Wrapper = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space.lg};
  box-shadow: 0 2px 8px ${({ theme }) => theme.colors.shadow};
  text-align: center;
`;

const Hours = styled.div`
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const HoursValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.text};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.sm};
  justify-content: center;
  flex-wrap: wrap;
`;

const clockButtonOverrides = css`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const ClockButton = styled(ButtonAccent)`${clockButtonOverrides}`;
const ClockButtonDanger = styled(ButtonDanger)`${clockButtonOverrides}`;
const ClockButtonSecondary = styled(ButtonSecondary)`${clockButtonOverrides}`;

export const ClockWidget = ({ status, hoursToday, onAction, loading }: ClockWidgetProps) => {
  const { t } = useTranslation();

  return (
    <Wrapper data-testid="clock-widget">
      <Hours>
        <HoursValue>{hoursToday}h</HoursValue>
      </Hours>
      <Actions>
        {status === AttendanceStates.IDLE && (
          <ClockButton
            onClick={() => onAction(AttendanceActions.CLOCK_IN)}
            disabled={loading}
          >
            {t("dashboard.clockIn")}
          </ClockButton>
        )}
        {status === AttendanceStates.CLOCKED_IN && (
          <>
            <ClockButtonDanger
              onClick={() => onAction(AttendanceActions.CLOCK_OUT)}
              disabled={loading}
            >
              {t("dashboard.clockOut")}
            </ClockButtonDanger>
            <ClockButtonSecondary
              onClick={() => onAction(AttendanceActions.BREAK_START)}
              disabled={loading}
            >
              {t("dashboard.break")}
            </ClockButtonSecondary>
          </>
        )}
        {status === AttendanceStates.ON_BREAK && (
          <ClockButton
            onClick={() => onAction(AttendanceActions.BREAK_END)}
            disabled={loading}
          >
            {t("dashboard.back")}
          </ClockButton>
        )}
      </Actions>
    </Wrapper>
  );
};
