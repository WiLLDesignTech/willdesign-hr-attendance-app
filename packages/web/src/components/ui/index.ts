// UI Primitives Library — barrel export
// All shared UI components live here. Import from 'components/ui'.

// Existing primitives (migrated from theme/primitives.ts)
export {
  Card,
  Button,
  ButtonPrimary,
  ButtonAccent,
  ButtonDanger,
  ButtonSecondary,
  SectionTitle,
  TextMuted,
  FormField,
  PageLayout,
  FormLayout,
} from "./primitives";

// New primitives
export { Modal } from "./Modal";
export { DataTable } from "./DataTable";
export { Tabs } from "./Tabs";
export { Calendar, type CalendarEvent } from "./Calendar";
export { FormWizard } from "./FormWizard";
export { Badge } from "./Badge";
export { ToastProvider, useToast } from "./Toast";
export { ProgressBar } from "./ProgressBar";
export { EmptyState } from "./EmptyState";
export { Skeleton } from "./Skeleton";
export { SearchInput } from "./SearchInput";
