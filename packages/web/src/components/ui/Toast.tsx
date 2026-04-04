import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";

type ToastVariant = "success" | "danger" | "info" | "warning";

interface ToastItem {
  readonly id: string;
  readonly message: string;
  readonly variant: ToastVariant;
}

interface ToastContextValue {
  show(message: string, variant?: ToastVariant): void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const AUTO_DISMISS_MS = 4000;

let toastCounter = 0;

export const ToastProvider = ({ children }: { readonly children: ReactNode }) => {
  const [toasts, setToasts] = useState<readonly ToastItem[]>([]);

  const show = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = `toast-${++toastCounter}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <ToastContainer>
          {toasts.map((toast) => (
            <ToastEntry key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </ToastContainer>,
        document.body,
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

const ToastEntry = ({
  toast,
  onDismiss,
}: {
  readonly toast: ToastItem;
  readonly onDismiss: (id: string) => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <ToastItemWrapper $variant={toast.variant} role="alert">
      <ToastMessage>{toast.message}</ToastMessage>
      <ToastClose onClick={() => onDismiss(toast.id)} aria-label="Close notification">
        ×
      </ToastClose>
    </ToastItemWrapper>
  );
};

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const VARIANT_COLORS: Record<ToastVariant, { bg: string; border: string }> = {
  success: { bg: "successLight", border: "success" },
  danger: { bg: "errorLight", border: "error" },
  info: { bg: "infoLight", border: "info" },
  warning: { bg: "warningLight", border: "warning" },
};

const ToastContainer = styled.div`
  position: fixed;
  top: ${({ theme }) => theme.space.md};
  right: ${({ theme }) => theme.space.md};
  z-index: ${({ theme }) => theme.zIndex.toast};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  pointer-events: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    left: ${({ theme }) => theme.space.md};
    right: ${({ theme }) => theme.space.md};
  }
`;

const ToastItemWrapper = styled.div<{ $variant: ToastVariant }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  background: ${({ theme, $variant }) =>
    theme.colors[VARIANT_COLORS[$variant].bg as keyof typeof theme.colors]};
  border-left: 3px solid
    ${({ theme, $variant }) =>
      theme.colors[VARIANT_COLORS[$variant].border as keyof typeof theme.colors]};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  min-width: 280px;
  max-width: 420px;
  pointer-events: auto;
  animation: ${slideIn} 200ms ease-out;
`;

const ToastMessage = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  line-height: ${({ theme }) => theme.lineHeights.normal};
`;

const ToastClose = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  padding: ${({ theme }) => theme.space.xs};
  line-height: 1;
  transition: color ${({ theme }) => theme.transition};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;
