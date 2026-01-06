// React Bits Stepper component for multi-step forms
import * as React from 'react';

export interface Step {
  label: string;
  icon?: React.ReactNode;
}

interface ReactBitsStepperProps {
  steps: Step[];
  activeStep: number; // 1-based
}

export const ReactBitsStepper: React.FC<ReactBitsStepperProps> = ({
  steps,
  activeStep,
}) => {
  return (
    <div className='flex items-center justify-center mb-6 gap-0 relative'>
      {steps.map((step, idx) => (
        <React.Fragment key={step.label}>
          <div className='flex flex-col items-center z-10'>
            <div
              className={`rounded-full border-2 flex items-center justify-center w-10 h-10 mb-1 transition-all duration-200 ${
                activeStep === idx + 1
                  ? 'border-blue-600 bg-blue-50 text-blue-700 scale-110'
                  : 'border-gray-300 bg-white text-gray-400 opacity-60'
              }`}
            >
              {step.icon}
            </div>
            <span
              className={`text-xs font-medium ${
                activeStep === idx + 1 ? 'text-blue-700' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className='w-8 h-1 bg-gradient-to-r from-blue-200 to-blue-600 mx-1 rounded-full relative top-4'
              style={{ opacity: activeStep > idx + 1 ? 1 : 0.4 }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
