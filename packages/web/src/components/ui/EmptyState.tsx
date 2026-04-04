import type { ReactNode } from "react";
import styled from "styled-components";

interface EmptyStateProps {
  readonly icon?: ReactNode;
  readonly message: string;
  readonly action?: ReactNode;
}

export const EmptyState = ({ icon, message, action }: EmptyStateProps) => {
  return (
    <Wrapper>
      {icon && <IconWrapper>{icon}</IconWrapper>}
      <Message>{message}</Message>
      {action && <ActionWrapper>{action}</ActionWrapper>}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.lg};
  text-align: center;
`;

const IconWrapper = styled.div`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const Message = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  max-width: 320px;
  line-height: ${({ theme }) => theme.lineHeights.normal};
`;

const ActionWrapper = styled.div`
  margin-top: ${({ theme }) => theme.space.md};
`;
