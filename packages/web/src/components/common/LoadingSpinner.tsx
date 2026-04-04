import styled, { keyframes } from "styled-components";
import { useTranslation } from "react-i18next";

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const SpinnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.space.xxl};
  gap: ${({ theme }) => theme.space.md};
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.accent};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const SpinnerText = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export function LoadingSpinner() {
  const { t } = useTranslation();
  return (
    <SpinnerWrapper>
      <Spinner />
      <SpinnerText>{t("common.loading")}</SpinnerText>
    </SpinnerWrapper>
  );
}
