import { useState, useEffect, useRef } from "react";
import styled from "styled-components";

interface SearchInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly debounceMs?: number;
}

const DEFAULT_DEBOUNCE = 300;

export const SearchInput = ({
  value,
  onChange,
  placeholder,
  debounceMs = DEFAULT_DEBOUNCE,
}: SearchInputProps) => {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  function handleChange(v: string) {
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), debounceMs);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <Wrapper>
      <Icon aria-hidden>⌕</Icon>
      <Input
        type="search"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
      />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.background};
  transition: border-color ${({ theme }) => theme.transition};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: ${({ theme }) => theme.focusRing};
  }
`;

const Icon = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const Input = styled.input`
  border: none;
  outline: none;
  background: transparent;
  flex: 1;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: ${({ theme }) => theme.fonts.body};
  color: ${({ theme }) => theme.colors.text};
  min-height: 32px;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;
