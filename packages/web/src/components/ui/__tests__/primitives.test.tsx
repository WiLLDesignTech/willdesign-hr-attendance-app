import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { theme } from "../../../theme/theme";
import { Modal } from "../Modal";
import { Tabs } from "../Tabs";
import { Badge } from "../Badge";
import { ProgressBar } from "../ProgressBar";
import { EmptyState } from "../EmptyState";
import { Skeleton } from "../Skeleton";
import { ToastProvider, useToast, AUTO_DISMISS_MS } from "../Toast";
import type { ReactElement } from "react";
import "../../../i18n/index";

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={theme}>
      <ToastProvider>{ui}</ToastProvider>
    </ThemeProvider>,
  );
}

describe("Modal", () => {
  it("renders nothing when closed", () => {
    renderWithTheme(
      <Modal isOpen={false} onClose={vi.fn()} title="Test">
        <p>Content</p>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog when open", () => {
    renderWithTheme(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    renderWithTheme(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    renderWithTheme(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>,
    );
    // The backdrop is the parent of the dialog
    const backdrop = screen.getByRole("dialog").parentElement;
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not close when dialog content is clicked", () => {
    const onClose = vi.fn();
    renderWithTheme(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>,
    );
    fireEvent.click(screen.getByText("Content"));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("Tabs", () => {
  const tabs = [
    { key: "a", label: "Tab A" },
    { key: "b", label: "Tab B" },
    { key: "c", label: "Tab C" },
  ];

  it("renders all tabs", () => {
    renderWithTheme(<Tabs tabs={tabs} activeKey="a" onChange={vi.fn()} />);
    expect(screen.getByText("Tab A")).toBeInTheDocument();
    expect(screen.getByText("Tab B")).toBeInTheDocument();
    expect(screen.getByText("Tab C")).toBeInTheDocument();
  });

  it("marks active tab with aria-selected", () => {
    renderWithTheme(<Tabs tabs={tabs} activeKey="b" onChange={vi.fn()} />);
    expect(screen.getByText("Tab B")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Tab A")).toHaveAttribute("aria-selected", "false");
  });

  it("calls onChange when tab is clicked", () => {
    const onChange = vi.fn();
    renderWithTheme(<Tabs tabs={tabs} activeKey="a" onChange={onChange} />);
    fireEvent.click(screen.getByText("Tab C"));
    expect(onChange).toHaveBeenCalledWith("c");
  });
});

describe("Badge", () => {
  it("renders label text", () => {
    renderWithTheme(<Badge label="Active" variant="success" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("defaults to info variant", () => {
    renderWithTheme(<Badge label="Info" />);
    expect(screen.getByText("Info")).toBeInTheDocument();
  });
});

describe("ProgressBar", () => {
  it("renders percentage label", () => {
    renderWithTheme(<ProgressBar value={75} max={100} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("caps at 100%", () => {
    renderWithTheme(<ProgressBar value={150} max={100} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("handles zero max", () => {
    renderWithTheme(<ProgressBar value={0} max={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("hides label when showLabel is false", () => {
    renderWithTheme(<ProgressBar value={50} max={100} showLabel={false} />);
    expect(screen.queryByText("50%")).not.toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders message", () => {
    renderWithTheme(<EmptyState message="No data found" />);
    expect(screen.getByText("No data found")).toBeInTheDocument();
  });

  it("renders action when provided", () => {
    renderWithTheme(<EmptyState message="Empty" action={<button>Add</button>} />);
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });
});

describe("Skeleton", () => {
  it("renders without crashing", () => {
    const { container } = renderWithTheme(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("Toast", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  function ToastTrigger() {
    const toast = useToast();
    return (
      <button onClick={() => toast.show("Test message", "success")}>
        Show Toast
      </button>
    );
  }

  it("shows toast when triggered", () => {
    renderWithTheme(<ToastTrigger />);
    fireEvent.click(screen.getByText("Show Toast"));
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("auto-dismisses after 4 seconds", () => {
    renderWithTheme(<ToastTrigger />);
    fireEvent.click(screen.getByText("Show Toast"));
    expect(screen.getByText("Test message")).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(AUTO_DISMISS_MS + 500); });
    expect(screen.queryByText("Test message")).not.toBeInTheDocument();
  });

  it("dismisses on close button click", () => {
    renderWithTheme(<ToastTrigger />);
    fireEvent.click(screen.getByText("Show Toast"));
    fireEvent.click(screen.getByLabelText("Close notification"));
    expect(screen.queryByText("Test message")).not.toBeInTheDocument();
  });
});
