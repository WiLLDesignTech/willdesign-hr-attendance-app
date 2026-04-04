import styled, { keyframes } from "styled-components";

interface SkeletonProps {
  readonly width?: string;
  readonly height?: string;
  readonly variant?: "text" | "circle" | "rect";
}

export const Skeleton = ({ width, height, variant = "text" }: SkeletonProps) => {
  return <SkeletonBlock $width={width} $height={height} $variant={variant} />;
};

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

const SKELETON_HEIGHTS: Record<string, string> = { circle: "40px", text: "1em", rect: "120px" };
const SKELETON_WIDTHS: Record<string, string> = { circle: "40px", text: "100%", rect: "100%" };
const SKELETON_RADII_KEYS: Record<string, "full" | "sm" | "md"> = { circle: "full", text: "sm", rect: "md" };

const SkeletonBlock = styled.div<{
  $width?: string;
  $height?: string;
  $variant: string;
}>`
  background: ${({ theme }) => theme.colors.surface};
  animation: ${pulse} 1.5s ease-in-out infinite;
  border-radius: ${({ theme, $variant }) => theme.radii[SKELETON_RADII_KEYS[$variant] ?? "md"]};
  width: ${({ $width, $variant }) => $width ?? SKELETON_WIDTHS[$variant] ?? "100%"};
  height: ${({ $height, $variant }) => $height ?? SKELETON_HEIGHTS[$variant] ?? "120px"};
`;
