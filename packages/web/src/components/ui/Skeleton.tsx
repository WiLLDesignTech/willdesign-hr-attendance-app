import styled, { keyframes } from "styled-components";

interface SkeletonProps {
  readonly width?: string;
  readonly height?: string;
  readonly variant?: "text" | "circle" | "rect";
}

export function Skeleton({ width, height, variant = "text" }: SkeletonProps) {
  return <SkeletonBlock $width={width} $height={height} $variant={variant} />;
}

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

const SkeletonBlock = styled.div<{
  $width?: string;
  $height?: string;
  $variant: string;
}>`
  background: ${({ theme }) => theme.colors.surface};
  animation: ${pulse} 1.5s ease-in-out infinite;
  border-radius: ${({ theme, $variant }) =>
    $variant === "circle"
      ? theme.radii.full
      : $variant === "text"
        ? theme.radii.sm
        : theme.radii.md};
  width: ${({ $width, $variant }) =>
    $width ?? ($variant === "circle" ? "40px" : "100%")};
  height: ${({ $height, $variant }) =>
    $height ?? ($variant === "circle" ? "40px" : $variant === "text" ? "1em" : "120px")};
`;
