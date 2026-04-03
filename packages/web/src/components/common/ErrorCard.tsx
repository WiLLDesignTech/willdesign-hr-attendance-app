import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, ButtonSecondary } from "../../theme/primitives";

const ErrorWrapper = styled(Card)`
  text-align: center;
  color: ${({ theme }) => theme.colors.warning};
`;

const ErrorMessage = styled.p`
  margin-bottom: ${({ theme }) => theme.space.md};
`;

interface ErrorCardProps {
  readonly error: Error | null;
  readonly onRetry?: () => void;
}

export function ErrorCard({ error, onRetry }: ErrorCardProps) {
  const { t } = useTranslation();
  return (
    <ErrorWrapper>
      <ErrorMessage>{error?.message ?? t("common.error")}</ErrorMessage>
      {onRetry && (
        <ButtonSecondary onClick={onRetry}>{t("common.retry")}</ButtonSecondary>
      )}
    </ErrorWrapper>
  );
}
