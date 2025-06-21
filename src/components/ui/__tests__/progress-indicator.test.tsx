/**
 * Progress Indicator Tests
 * 
 * Tests for the progress indicator component including accessibility and interactions
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressIndicator, CompactProgressIndicator, type ProgressStep } from '../progress-indicator';

const mockSteps: ProgressStep[] = [
  {
    id: 'step-1',
    title: 'Personal Information',
    description: 'Enter your basic details',
    isCompleted: true,
  },
  {
    id: 'step-2',
    title: 'Account Setup',
    description: 'Create your account',
    isActive: true,
  },
  {
    id: 'step-3',
    title: 'Verification',
    description: 'Verify your identity',
  },
  {
    id: 'step-4',
    title: 'Complete',
    description: 'Finish setup',
    isDisabled: true,
  },
];

describe('ProgressIndicator', () => {
  describe('Rendering', () => {
    it('should render all steps correctly', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={1} />);
      
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Account Setup')).toBeInTheDocument();
      expect(screen.getByText('Verification')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('should render step numbers and check marks correctly', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={1} />);
      
      // Completed step should show check mark
      expect(screen.getByLabelText('Step 1: Personal Information')).toBeInTheDocument();
      
      // Active step should show number
      expect(screen.getByText('2')).toBeInTheDocument();
      
      // Future steps should show numbers
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should render descriptions when not in compact mode', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={1} />);
      
      expect(screen.getByText('Enter your basic details')).toBeInTheDocument();
      expect(screen.getByText('Create your account')).toBeInTheDocument();
    });

    it('should not render descriptions in compact mode', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={1} variant="compact" />);
      
      expect(screen.queryByText('Enter your basic details')).not.toBeInTheDocument();
      expect(screen.queryByText('Create your account')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper progress element for screen readers', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={1} />);
      
      const progressElement = screen.getByRole('progressbar');
      expect(progressElement).toBeInTheDocument();
      expect(progressElement).toHaveAttribute('value', '2');
      expect(progressElement).toHaveAttribute('max', '4');
    });

    it('should have proper aria labels for steps', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={1} />);
      
      expect(screen.getByLabelText('Step 1: Personal Information')).toBeInTheDocument();
      expect(screen.getByLabelText('Step 2: Account Setup')).toBeInTheDocument();
    });

    it('should use button elements for clickable steps', () => {
      const onStepClick = jest.fn();
      const { container } = render(<ProgressIndicator steps={mockSteps} currentStep={1} onStepClick={onStepClick} />);
      
      // Find buttons using query selector since they're in aria-hidden container
      const clickableSteps = container.querySelectorAll('button');
      expect(clickableSteps).toHaveLength(3); // All except disabled step
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      const onStepClick = jest.fn();
      render(<ProgressIndicator steps={mockSteps} currentStep={1} onStepClick={onStepClick} />);
      
      const firstStep = screen.getByLabelText('Step 1: Personal Information');
      firstStep.focus();
      
      await user.keyboard('{Enter}');
      expect(onStepClick).toHaveBeenCalledWith(0);
      
      await user.keyboard(' ');
      expect(onStepClick).toHaveBeenCalledWith(0);
    });
  });

  describe('Interactions', () => {
    it('should call onStepClick when step is clicked', async () => {
      const user = userEvent.setup();
      const onStepClick = jest.fn();
      render(<ProgressIndicator steps={mockSteps} currentStep={1} onStepClick={onStepClick} />);
      
      const firstStep = screen.getByLabelText('Step 1: Personal Information');
      await user.click(firstStep);
      
      expect(onStepClick).toHaveBeenCalledWith(0);
    });

    it('should not call onStepClick for disabled steps', async () => {
      const user = userEvent.setup();
      const onStepClick = jest.fn();
      render(<ProgressIndicator steps={mockSteps} currentStep={1} onStepClick={onStepClick} />);
      
      const disabledStep = screen.getByLabelText('Step 4: Complete');
      expect(disabledStep).toHaveClass('cursor-not-allowed');
      
      // Disabled step should not be clickable (it's a div, not a button)
      await user.click(disabledStep);
      expect(onStepClick).not.toHaveBeenCalled();
    });

    it('should not render buttons when onStepClick is not provided', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={1} />);
      
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });
  });

  describe('Variants', () => {
    it('should apply compact styling', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={1} variant="compact" />);
      
      const stepElement = screen.getByLabelText('Step 1: Personal Information');
      expect(stepElement).toHaveClass('w-8', 'h-8', 'text-sm');
    });

    it('should apply default styling', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={1} variant="default" />);
      
      const stepElement = screen.getByLabelText('Step 1: Personal Information');
      expect(stepElement).toHaveClass('w-10', 'h-10', 'text-base');
    });
  });

  describe('CompactProgressIndicator', () => {
    it('should render without labels', () => {
      render(<CompactProgressIndicator steps={mockSteps} currentStep={1} />);
      
      expect(screen.queryByText('Personal Information')).not.toBeInTheDocument();
      expect(screen.queryByText('Account Setup')).not.toBeInTheDocument();
    });

    it('should use compact variant', () => {
      render(<CompactProgressIndicator steps={mockSteps} currentStep={1} />);
      
      const stepElement = screen.getByLabelText('Step 1: Personal Information');
      expect(stepElement).toHaveClass('w-8', 'h-8', 'text-sm');
    });
  });

  describe('Step States', () => {
    it('should compute step states correctly', () => {
      render(<ProgressIndicator steps={mockSteps} currentStep={2} />);
      
      // Steps before current should be completed
      const step1 = screen.getByLabelText('Step 1: Personal Information');
      expect(step1).toHaveClass('bg-primary-300');
      
      const step2 = screen.getByLabelText('Step 2: Account Setup');
      expect(step2).toHaveClass('bg-primary-300');
      
      // Current step should be active
      const step3 = screen.getByLabelText('Step 3: Verification');
      expect(step3).toHaveClass('bg-primary-500');
    });

    it('should respect explicit step states', () => {
      const customSteps = [
        { ...mockSteps[0], isCompleted: false },
        { ...mockSteps[1], isActive: false },
      ];
      
      render(<ProgressIndicator steps={customSteps} currentStep={1} />);
      
      const step1 = screen.getByLabelText('Step 1: Personal Information');
      expect(step1).not.toHaveClass('bg-primary-300');
    });
  });
});
