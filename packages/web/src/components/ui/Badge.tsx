import styled from "styled-components";

type BadgeVariant = "info" | "success" | "warning" | "danger";

interface BadgeProps {
  readonly label: string;
  readonly variant?: BadgeVariant;
}

export function Badge({ label, variant = "info" }: BadgeProps) {
  return <Pill $variant={variant}>{label}</Pill>;
}

const VARIANT_MAP = {
  info: { bg: "infoLight", text: "info" },
  success: { bg: "successLight", text: "success" },
  warning: { bg: "warningLight", text: "warning" },
  danger: { bg: "errorLight", text: "error" },
} as const;

const Pill = styled.span<{ $variant: BadgeVariant }>`
  display: inline-flex;
  align-items: center;
  padding: 2px ${({ theme }) => theme.space.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme, $variant }) =>
    theme.colors[VARIANT_MAP[$variant].bg as keyof typeof theme.colors]};
  color: ${({ theme, $variant }) =>
    theme.colors[VARIANT_MAP[$variant].text as keyof typeof theme.colors]};
  white-space: nowrap;
  line-height: 1.5;
`;
