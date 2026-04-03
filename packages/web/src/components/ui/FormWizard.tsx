import { useState } from "react";
import { FormProvider, useForm, type FieldValues, type UseFormReturn, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodObject, ZodRawShape } from "zod";
import styled from "styled-components";

interface FormWizardStep {
  readonly label: string;
  readonly schema: ZodObject<ZodRawShape>;
  readonly render: (form: UseFormReturn) => React.ReactNode;
}

interface FormWizardProps {
  readonly steps: readonly FormWizardStep[];
  readonly onSubmit: (data: Record<string, unknown>) => void;
  readonly isSubmitting?: boolean;
}

export function FormWizard({
  steps,
  onSubmit,
  isSubmitting = false,
}: FormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];

  const form = useForm({
    resolver: step ? zodResolver(step.schema) as unknown as Resolver<FieldValues> : undefined,
    mode: "onTouched",
  });

  if (!step) return null;

  const isLast = currentStep === steps.length - 1;

  async function handleNext() {
    const valid = await form.trigger();
    if (!valid) return;

    if (isLast) {
      form.handleSubmit((data) => onSubmit(data as Record<string, unknown>))();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }

  return (
    <FormProvider {...form}>
      <Wrapper>
        <StepIndicator>
          {steps.map((s, i) => (
            <StepItem key={s.label} $state={i < currentStep ? "done" : i === currentStep ? "active" : "pending"}>
              <StepNumber>{i + 1}</StepNumber>
              <StepLabel>{s.label}</StepLabel>
            </StepItem>
          ))}
        </StepIndicator>

        <StepContent>
          {step.render(form)}
        </StepContent>

        <Actions>
          {currentStep > 0 && (
            <BackButton type="button" onClick={handleBack}>
              Back
            </BackButton>
          )}
          <NextButton type="button" onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : isLast ? "Submit" : "Next"}
          </NextButton>
        </Actions>
      </Wrapper>
    </FormProvider>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
`;

const StepIndicator = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.md};
  overflow-x: auto;
  padding-bottom: ${({ theme }) => theme.space.sm};
`;

const StepItem = styled.div<{ $state: "done" | "active" | "pending" }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  flex-shrink: 0;
  opacity: ${({ $state }) => ($state === "pending" ? 0.4 : 1)};
`;

const StepNumber = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.textInverse};
`;

const StepLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
`;

const StepContent = styled.div`
  min-height: 200px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space.sm};
`;

const BackButton = styled.button`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  min-height: 44px;
  transition: all ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.surface};
  }
`;

const NextButton = styled.button`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.textInverse};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  min-height: 44px;
  transition: all ${({ theme }) => theme.transition};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.hover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
