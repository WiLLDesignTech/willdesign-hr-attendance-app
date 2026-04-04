import styled from "styled-components";

interface ProgressBarProps {
  readonly value: number;
  readonly max: number;
  readonly variant?: "accent" | "success" | "warning" | "danger";
  readonly showLabel?: boolean;
}

export const ProgressBar = ({
  value,
  max,
  variant = "accent",
  showLabel = true,
}: ProgressBarProps) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <Wrapper>
      <Track role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <Fill $pct={pct} $variant={variant} />
      </Track>
      {showLabel && <Label>{pct}%</Label>}
    </Wrapper>
  );
};

const VARIANT_COLORS: Record<string, string> = {
  accent: "accent",
  success: "success",
  warning: "warning",
  danger: "error",
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const Track = styled.div`
  flex: 1;
  height: 8px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
`;

const Fill = styled.div<{ $pct: number; $variant: string }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ theme, $variant }) =>
    theme.colors[VARIANT_COLORS[$variant] as keyof typeof theme.colors]};
  border-radius: ${({ theme }) => theme.radii.full};
  transition: width 300ms ease-out;
`;

const Label = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
  min-width: 36px;
  text-align: right;
`;
