import { useState, useMemo } from "react";
import { FormProvider, useForm, type FieldValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import type { ZodObject, ZodRawShape } from "zod";
import styled from "styled-components";
import { ButtonAccent, ButtonSecondary } from "./primitives";

interface FormWizardStep {
  readonly label: string;
  readonly schema: ZodObject<ZodRawShape>;
  readonly fields: readonly string[];
  readonly render: (form: ReturnType<typeof useForm>) => React.ReactNode;
}

interface FormWizardProps {
  readonly steps: readonly FormWizardStep[];
  readonly onSubmit: (data: Record<string, unknown>) => void;
  readonly isSubmitting?: boolean;
}

const getStepState = (i: number, current: number): "done" | "active" | "pending" => {
  if (i < current) return "done";
  if (i === current) return "active";
  return "pending";
};

export const FormWizard = ({
  steps,
  onSubmit,
  isSubmitting = false,
}: FormWizardProps) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const fullSchema = useMemo(() => {
    const [first, ...rest] = steps;
    return rest.reduce((acc, s) => acc.merge(s.schema), first!.schema);
  }, [steps]);

  const form = useForm({
    resolver: zodResolver(fullSchema) as unknown as Resolver<FieldValues>,
    mode: "onTouched",
  });

  const step = steps[currentStep];
  if (!step) return null;

  const isLast = currentStep === steps.length - 1;

  const getButtonLabel = (): string => {
    if (isSubmitting) return t("common.submitting");
    if (isLast) return t("common.submit");
    return t("common.next");
  };

  const handleNext = async () => {
    const currentStepData = steps[currentStep];
    if (!currentStepData) return;
    const valid = await form.trigger(currentStepData.fields as string[]);
    if (!valid) return;

    if (isLast) {
      form.handleSubmit((data) => onSubmit(data as Record<string, unknown>))();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  return (
    <FormProvider {...form}>
      <Wrapper>
        <StepIndicator>
          {steps.map((s, i) => (
            <StepItem key={s.label} $state={getStepState(i, currentStep)}>
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
            <BackBtn type="button" onClick={handleBack}>
              {t("common.back")}
            </BackBtn>
          )}
          <NextBtn type="button" onClick={handleNext} disabled={isSubmitting}>
            {getButtonLabel()}
          </NextBtn>
        </Actions>
      </Wrapper>
    </FormProvider>
  );
};

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

const BackBtn = styled(ButtonSecondary)`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
`;

const NextBtn = styled(ButtonAccent)`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
`;
