import styled from "styled-components";

interface TabItem {
  readonly key: string;
  readonly label: string;
}

interface TabsProps {
  readonly tabs: readonly TabItem[];
  readonly activeKey: string;
  readonly onChange: (key: string) => void;
}

export function Tabs({ tabs, activeKey, onChange }: TabsProps) {
  return (
    <TabBar role="tablist">
      {tabs.map((tab) => (
        <TabButton
          key={tab.key}
          role="tab"
          aria-selected={tab.key === activeKey}
          $active={tab.key === activeKey}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </TabButton>
      ))}
    </TabBar>
  );
}

const TabBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.xs};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme, $active }) =>
    $active ? theme.fontWeights.semibold : theme.fontWeights.medium};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.accent : theme.colors.textMuted};
  cursor: pointer;
  white-space: nowrap;
  position: relative;
  min-height: 44px;
  transition: color ${({ theme }) => theme.transition};

  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: ${({ theme, $active }) =>
      $active ? theme.colors.accent : "transparent"};
    transition: background ${({ theme }) => theme.transition};
  }

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`;
