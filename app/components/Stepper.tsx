"use client";

import { Check } from "lucide-react";

interface Step {
  label: string;
}

interface StepperProps {
  steps: Step[];
  activeIndex: number;
}

export function Stepper({ steps, activeIndex }: StepperProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {steps.map((step, index) => {
        const isActive    = index === activeIndex;
        const isCompleted = index < activeIndex;

        return (
          <div key={step.label} className="flex items-center gap-1 sm:gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "bg-accent-soft text-accent border border-accent/30"
                  : isCompleted
                  ? "bg-hover text-ink border border-line"
                  : "text-ink-3"
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                  isActive
                    ? "bg-accent text-accent-fg"
                    : isCompleted
                    ? "bg-ok text-white"
                    : "bg-hover text-ink-3 border border-line"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" strokeWidth={2.5} />
                ) : (
                  index + 1
                )}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`w-4 sm:w-6 h-px transition-colors duration-200 ${
                  isCompleted ? "bg-accent/40" : "bg-line"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
