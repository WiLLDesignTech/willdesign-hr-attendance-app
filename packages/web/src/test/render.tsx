import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "styled-components";
import { AuthProvider } from "../hooks/useAuth";
import { ToastProvider } from "../components/ui/Toast";
import { theme } from "../theme/theme";
import type { ReactElement, ReactNode } from "react";
import "../i18n/index";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

interface WrapperOptions {
  readonly initialEntries?: string[];
}

function createWrapper({ initialEntries = ["/"] }: WrapperOptions = {}) {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider theme={theme}>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <MemoryRouter initialEntries={initialEntries}>
                {children}
              </MemoryRouter>
            </AuthProvider>
          </QueryClientProvider>
        </ToastProvider>
      </ThemeProvider>
    );
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & WrapperOptions,
) {
  const { initialEntries, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: createWrapper({ initialEntries }),
    ...renderOptions,
  });
}
