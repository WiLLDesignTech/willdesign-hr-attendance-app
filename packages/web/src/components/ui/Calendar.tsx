import { useMemo } from "react";
import { DayPicker } from "react-day-picker";
import { dateToDateStr } from "@hr-attendance-app/types";
import styled from "styled-components";

export interface CalendarEvent {
  readonly id: string;
  readonly label: string;
  readonly variant: "info" | "success" | "warning" | "danger";
}

interface CalendarProps {
  readonly selectedDate?: Date;
  readonly onDateSelect?: (date: Date) => void;
  readonly highlightedDates?: ReadonlySet<string>;
  readonly month?: Date;
  readonly onMonthChange?: (month: Date) => void;
}

export const Calendar = ({
  selectedDate,
  onDateSelect,
  highlightedDates,
  month,
  onMonthChange,
}: CalendarProps) => {
  const modifiers = useMemo(() => {
    if (!highlightedDates) return undefined;
    return { highlighted: (date: Date) => highlightedDates.has(dateToDateStr(date)) };
  }, [highlightedDates]);

  const modifiersClassNames = useMemo(
    () => (highlightedDates ? { highlighted: "rdp-day_highlighted" } : undefined),
    [highlightedDates],
  );

  return (
    <CalendarWrapper>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(d) => d && onDateSelect?.(d)}
        month={month}
        onMonthChange={onMonthChange}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
      />
    </CalendarWrapper>
  );
};

const CalendarWrapper = styled.div`
  .rdp {
    --rdp-cell-size: 44px;
    --rdp-accent-color: ${({ theme }) => theme.colors.accent};
    --rdp-background-color: ${({ theme }) => theme.colors.selected};
    --rdp-accent-color-dark: ${({ theme }) => theme.colors.hover};
    font-family: ${({ theme }) => theme.fonts.body};
  }

  .rdp-month {
    width: 100%;
  }

  .rdp-month_grid {
    width: 100%;
    border-collapse: collapse;
  }

  .rdp-weekday {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.textMuted};
    text-transform: uppercase;
    padding: ${({ theme }) => theme.space.xs};
  }

  .rdp-day {
    width: var(--rdp-cell-size);
    height: var(--rdp-cell-size);
    text-align: center;
    vertical-align: middle;
  }

  .rdp-day_button {
    width: var(--rdp-cell-size);
    height: var(--rdp-cell-size);
    border-radius: ${({ theme }) => theme.radii.md};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition};
    border: none;
    background: none;

    &:hover {
      background: ${({ theme }) => theme.colors.surfaceHover};
    }
  }

  .rdp-selected .rdp-day_button {
    background: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.textInverse};
  }

  .rdp-today .rdp-day_button {
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.accent};
  }

  .rdp-day_highlighted .rdp-day_button {
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: ${({ theme }) => theme.colors.info};
    }
  }

  .rdp-button_previous,
  .rdp-button_next {
    width: 36px;
    height: 36px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.sm};
    background: ${({ theme }) => theme.colors.background};
    cursor: pointer;
    transition: background ${({ theme }) => theme.transition};

    &:hover {
      background: ${({ theme }) => theme.colors.surface};
    }
  }

  .rdp-month_caption {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    .rdp {
      --rdp-cell-size: 36px;
    }
  }
`;
