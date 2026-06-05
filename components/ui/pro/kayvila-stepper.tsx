"use client";

import { Stepper } from "@heroui-pro/react";
import { cn } from "@/lib/utils";

export type KayvilaStep = {
  title: string;
  description?: string;
};

type KayvilaStepperProps = {
  steps: KayvilaStep[];
  currentStep: number;
  className?: string;
};

export function KayvilaStepper({ steps, currentStep, className }: KayvilaStepperProps) {
  return (
    <Stepper
      currentStep={currentStep}
      className={cn(
        "[&_[data-slot=step-indicator][data-status=complete]]:bg-gold [&_[data-slot=step-indicator][data-status=active]]:border-gold [&_[data-slot=step-separator][data-status=complete]]:bg-gold",
        className
      )}
    >
      {steps.map((step) => (
        <Stepper.Step key={step.title}>
          <Stepper.Indicator />
          <Stepper.Content>
            <Stepper.Title className="font-sora text-xs text-navy">{step.title}</Stepper.Title>
            {step.description ? (
              <Stepper.Description className="hidden text-[10px] text-muted sm:block">
                {step.description}
              </Stepper.Description>
            ) : null}
          </Stepper.Content>
          <Stepper.Separator />
        </Stepper.Step>
      ))}
    </Stepper>
  );
}
