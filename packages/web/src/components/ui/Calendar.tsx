import { useMemo, useCallback, useState } from "react";
import { DayPicker } from "react-day-picker";
import { todayDate, dateToLocalDateStr } from "@hr-attendance-app/types";
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
  month: controlledMonth,
  onMonthChange,
}: CalendarProps) => {
  const [internalMonth, setInternalMonth] = useState(() => selectedDate ?? new Date());
  const month = controlledMonth ?? internalMonth;

  const handleMonthChange = useCallback((m: Date) => {
    if (!controlledMonth) setInternalMonth(m);
    onMonthChange?.(m);
  }, [controlledMonth, onMonthChange]);

  const handleSelect = useCallback((date: Date | undefined) => {
    if (date) onDateSelect?.(date);
  }, [onDateSelect]);

  const today = useMemo(() => todayDate(), []);

  const modifiers = useMemo(() => {
    const mods: Record<string, (date: Date) => boolean> = {};
    if (highlightedDates) {
      mods.highlighted = (date: Date) => highlightedDates.has(dateToLocalDateStr(date));
    }
    mods.isToday = (date: Date) => dateToLocalDateStr(date) === today;
    return mods;
  }, [highlightedDates, today]);

  const modifiersClassNames = useMemo(() => ({
    highlighted: "cal-highlighted",
    isToday: "cal-today",
  }), []);

  return (
    <Wrapper>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={handleSelect}
        month={month}
        onMonthChange={handleMonthChange}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        showOutsideDays
        fixedWeeks
      />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  .rdp {
    --rdp-cell-size: 40px;
    --rdp-accent-color: ${({ theme }) => theme.colors.accent};
    --rdp-background-color: ${({ theme }) => theme.colors.selected};
    font-family: ${({ theme }) => theme.fonts.body};
    margin: 0;
  }

  .rdp-root {
    width: 100%;
  }

  .rdp-month {
    width: 100%;
  }

  .rdp-month_grid {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 2px;
  }

  /* Header row */
  .rdp-weekday {
    font-size: ${({ theme }) => theme.fontSizes.xxs};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: ${({ theme }) => theme.space.xs} 0;
    text-align: center;
  }

  /* Day cell */
  .rdp-day {
    width: var(--rdp-cell-size);
    height: var(--rdp-cell-size);
    text-align: center;
    vertical-align: middle;
    padding: 1px;
  }

  .rdp-day_button {
    width: 100%;
    height: 100%;
    min-width: 36px;
    min-height: 36px;
    border-radius: ${({ theme }) => theme.radii.md};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.text};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition};
    border: none;
    background: none;
    position: relative;

    &:hover {
      background: ${({ theme }) => theme.colors.surfaceHover};
    }
  }

  /* Outside days (prev/next month) */
  .rdp-outside .rdp-day_button {
    color: ${({ theme }) => theme.colors.borderLight};
  }

  /* Selected day */
  .rdp-selected .rdp-day_button {
    background: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.textInverse};
    font-weight: ${({ theme }) => theme.fontWeights.bold};

    &:hover {
      background: ${({ theme }) => theme.colors.hover};
    }
  }

  /* Today */
  .cal-today .rdp-day_button {
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.accent};
    border: 2px solid ${({ theme }) => theme.colors.accent};
  }

  /* Today + Selected */
  .rdp-selected.cal-today .rdp-day_button {
    color: ${({ theme }) => theme.colors.textInverse};
    border-color: ${({ theme }) => theme.colors.accent};
  }

  /* Highlighted (has events) */
  .cal-highlighted .rdp-day_button::after {
    content: "";
    position: absolute;
    bottom: 3px;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 6px;
    border-radius: ${({ theme }) => theme.radii.full};
    background: ${({ theme }) => theme.colors.accent};
  }

  .rdp-selected.cal-highlighted .rdp-day_button::after {
    background: ${({ theme }) => theme.colors.textInverse};
  }

  /* Navigation */
  .rdp-nav {
    display: flex;
    gap: ${({ theme }) => theme.space.xs};
  }

  .rdp-button_previous,
  .rdp-button_next {
    width: 32px;
    height: 32px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.sm};
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all ${({ theme }) => theme.transition};

    &:hover {
      border-color: ${({ theme }) => theme.colors.accent};
      color: ${({ theme }) => theme.colors.accent};
    }

    svg {
      width: 14px;
      height: 14px;
    }
  }

  /* Month caption */
  .rdp-month_caption {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.text};
    padding: ${({ theme }) => theme.space.xs} 0;
  }

  .rdp-caption_label {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  /* Mobile */
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    .rdp {
      --rdp-cell-size: 36px;
    }

    .rdp-day_button {
      min-width: 32px;
      min-height: 32px;
      font-size: ${({ theme }) => theme.fontSizes.xs};
    }
  }
`;
