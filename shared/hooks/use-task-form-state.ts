/**
 * Shared Task Form State Management Hook
 * 
 * Provides centralized form state management for task creation/editing
 * across different wizard implementations.
 */

import { useCallback, useReducer, useEffect } from 'react';
import { z } from 'zod';
import { TASK_CONFIG } from '../config/task-config';
import { taskCreateSchema, taskUpdateSchema } from '../validation/task-validation';
import type { TaskCreateData, TaskUpdateData } from '../validation/task-validation';

/**
 * Form step definitions
 */
export interface FormStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  order: number;
}

/**
 * Form state interface
 */
export interface TaskFormState {
  // Form data
  data: Partial<TaskCreateData>;
  
  // Validation state
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  isValid: boolean;
  
  // Form state
  currentStep: number;
  completedSteps: Set<number>;
  isDirty: boolean;
  isSubmitting: boolean;
  
  // Step management
  steps: FormStep[];
  canGoToStep: (stepIndex: number) => boolean;
  canProceed: boolean;
  
  // Persistence
  lastSaved?: Date;
  autoSaveEnabled: boolean;
}

/**
 * Form actions
 */
type FormAction =
  | { type: 'SET_FIELD'; field: string; value: any }
  | { type: 'SET_FIELDS'; fields: Record<string, any> }
  | { type: 'SET_ERROR'; field: string; errors: string[] }
  | { type: 'CLEAR_ERROR'; field: string }
  | { type: 'SET_TOUCHED'; field: string; touched?: boolean }
  | { type: 'SET_STEP'; step: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'COMPLETE_STEP'; step: number }
  | { type: 'SET_SUBMITTING'; submitting: boolean }
  | { type: 'VALIDATE_FORM' }
  | { type: 'RESET_FORM'; initialData?: Partial<TaskCreateData> }
  | { type: 'LOAD_SAVED_DATA'; data: Partial<TaskCreateData> }
  | { type: 'MARK_SAVED' };

/**
 * Default form steps
 */
const DEFAULT_STEPS: FormStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Task title, description, and category',
    required: true,
    order: 1,
  },
  {
    id: 'location',
    title: 'Location & Schedule',
    description: 'Where and when the task needs to be done',
    required: true,
    order: 2,
  },
  {
    id: 'budget',
    title: 'Budget & Payment',
    description: 'Set your budget and payment terms',
    required: true,
    order: 3,
  },
  {
    id: 'requirements',
    title: 'Requirements',
    description: 'Skills and special requirements',
    required: false,
    order: 4,
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Review your task before posting',
    required: true,
    order: 5,
  },
];

/**
 * Form state reducer
 */
function formReducer(state: TaskFormState, action: FormAction): TaskFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        data: {
          ...state.data,
          [action.field]: action.value,
        },
        isDirty: true,
        errors: {
          ...state.errors,
          [action.field]: [], // Clear errors when field changes
        },
      };

    case 'SET_FIELDS':
      return {
        ...state,
        data: {
          ...state.data,
          ...action.fields,
        },
        isDirty: true,
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.field]: action.errors,
        },
      };

    case 'CLEAR_ERROR':
      const { [action.field]: _, ...restErrors } = state.errors;
      return {
        ...state,
        errors: restErrors,
      };

    case 'SET_TOUCHED':
      return {
        ...state,
        touched: {
          ...state.touched,
          [action.field]: action.touched ?? true,
        },
      };

    case 'SET_STEP':
      if (action.step >= 0 && action.step < state.steps.length && state.canGoToStep(action.step)) {
        return {
          ...state,
          currentStep: action.step,
        };
      }
      return state;

    case 'NEXT_STEP':
      if (state.currentStep < state.steps.length - 1 && state.canProceed) {
        return {
          ...state,
          currentStep: state.currentStep + 1,
          completedSteps: new Set([...state.completedSteps, state.currentStep]),
        };
      }
      return state;

    case 'PREV_STEP':
      if (state.currentStep > 0) {
        return {
          ...state,
          currentStep: state.currentStep - 1,
        };
      }
      return state;

    case 'COMPLETE_STEP':
      return {
        ...state,
        completedSteps: new Set([...state.completedSteps, action.step]),
      };

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.submitting,
      };

    case 'VALIDATE_FORM':
      return validateFormState(state);

    case 'RESET_FORM':
      return createInitialState(action.initialData, state.steps, state.autoSaveEnabled);

    case 'LOAD_SAVED_DATA':
      return {
        ...state,
        data: { ...state.data, ...action.data },
        isDirty: false,
      };

    case 'MARK_SAVED':
      return {
        ...state,
        isDirty: false,
        lastSaved: new Date(),
      };

    default:
      return state;
  }
}

/**
 * Validate form state
 */
function validateFormState(state: TaskFormState): TaskFormState {
  const schema = taskCreateSchema;
  const result = schema.safeParse(state.data);
  
  if (result.success) {
    return {
      ...state,
      errors: {},
      isValid: true,
    };
  }

  const errors: Record<string, string[]> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(error.message);
  });

  return {
    ...state,
    errors,
    isValid: false,
  };
}

/**
 * Check if step is valid
 */
function isStepValid(stepId: string, data: Partial<TaskCreateData>, errors: Record<string, string[]>): boolean {
  switch (stepId) {
    case 'basic-info':
      return !!(data.title && data.description && data.category) && 
             !errors.title && !errors.description && !errors.category;
    
    case 'location':
      return !!(data.location?.isRemote || (data.location?.address && data.location?.city)) &&
             !errors['location.address'] && !errors['location.city'];
    
    case 'budget':
      return !!(data.budget?.amount && data.budget?.type) &&
             !errors['budget.amount'] && !errors['budget.type'];
    
    case 'requirements':
      return true; // Optional step
    
    case 'review':
      return Object.keys(errors).length === 0;
    
    default:
      return false;
  }
}

/**
 * Create initial state
 */
function createInitialState(
  initialData?: Partial<TaskCreateData>,
  steps: FormStep[] = DEFAULT_STEPS,
  autoSaveEnabled: boolean = true
): TaskFormState {
  const data = {
    ...TASK_CONFIG.DEFAULTS,
    priority: TASK_CONFIG.DEFAULTS.PRIORITY,
    budget: {
      amount: 0,
      type: TASK_CONFIG.DEFAULTS.BUDGET_TYPE,
      currency: TASK_CONFIG.DEFAULTS.CURRENCY,
      negotiable: TASK_CONFIG.DEFAULTS.NEGOTIABLE,
    },
    location: {
      isRemote: TASK_CONFIG.DEFAULTS.IS_REMOTE,
    },
    tags: [],
    ...initialData,
  };

  return {
    data,
    errors: {},
    touched: {},
    isValid: false,
    currentStep: 0,
    completedSteps: new Set(),
    isDirty: false,
    isSubmitting: false,
    steps,
    canGoToStep: (stepIndex: number) => {
      // Can always go to first step
      if (stepIndex === 0) return true;
      // Can go to a step if all previous required steps are completed
      for (let i = 0; i < stepIndex; i++) {
        const step = steps[i];
        if (step.required && !isStepValid(step.id, data, {})) {
          return false;
        }
      }
      return true;
    },
    canProceed: false,
    autoSaveEnabled,
  };
}

/**
 * Task form state management hook
 */
export function useTaskFormState(
  initialData?: Partial<TaskCreateData>,
  customSteps?: FormStep[],
  options: {
    autoSave?: boolean;
    persistKey?: string;
    onAutoSave?: (data: Partial<TaskCreateData>) => void;
  } = {}
) {
  const steps = customSteps || DEFAULT_STEPS;
  const [state, dispatch] = useReducer(
    formReducer,
    createInitialState(initialData, steps, options.autoSave ?? true)
  );

  // Auto-save functionality
  useEffect(() => {
    if (state.autoSaveEnabled && state.isDirty && options.onAutoSave) {
      const timeoutId = setTimeout(() => {
        options.onAutoSave!(state.data);
        dispatch({ type: 'MARK_SAVED' });
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [state.data, state.isDirty, state.autoSaveEnabled, options.onAutoSave]);

  // Load persisted data
  useEffect(() => {
    if (options.persistKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`task-form-${options.persistKey}`);
        if (saved) {
          const data = JSON.parse(saved);
          dispatch({ type: 'LOAD_SAVED_DATA', data });
        }
      } catch (error) {
        console.warn('Failed to load saved form data:', error);
      }
    }
  }, [options.persistKey]);

  // Persist data to localStorage
  useEffect(() => {
    if (options.persistKey && state.isDirty && typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `task-form-${options.persistKey}`,
          JSON.stringify(state.data)
        );
      } catch (error) {
        console.warn('Failed to persist form data:', error);
      }
    }
  }, [state.data, state.isDirty, options.persistKey]);

  // Update canProceed based on current step validity
  const currentStep = state.steps[state.currentStep];
  const canProceed = currentStep ? isStepValid(currentStep.id, state.data, state.errors) : false;

  const updatedState = { ...state, canProceed };

  // Action creators
  const actions = {
    setField: useCallback((field: string, value: any) => {
      dispatch({ type: 'SET_FIELD', field, value });
    }, []),

    setFields: useCallback((fields: Record<string, any>) => {
      dispatch({ type: 'SET_FIELDS', fields });
    }, []),

    setError: useCallback((field: string, errors: string[]) => {
      dispatch({ type: 'SET_ERROR', field, errors });
    }, []),

    clearError: useCallback((field: string) => {
      dispatch({ type: 'CLEAR_ERROR', field });
    }, []),

    setTouched: useCallback((field: string, touched?: boolean) => {
      dispatch({ type: 'SET_TOUCHED', field, touched });
    }, []),

    goToStep: useCallback((step: number) => {
      dispatch({ type: 'SET_STEP', step });
    }, []),

    nextStep: useCallback(() => {
      dispatch({ type: 'NEXT_STEP' });
    }, []),

    prevStep: useCallback(() => {
      dispatch({ type: 'PREV_STEP' });
    }, []),

    completeStep: useCallback((step: number) => {
      dispatch({ type: 'COMPLETE_STEP', step });
    }, []),

    setSubmitting: useCallback((submitting: boolean) => {
      dispatch({ type: 'SET_SUBMITTING', submitting });
    }, []),

    validate: useCallback(() => {
      dispatch({ type: 'VALIDATE_FORM' });
    }, []),

    reset: useCallback((newInitialData?: Partial<TaskCreateData>) => {
      dispatch({ type: 'RESET_FORM', initialData: newInitialData });
    }, []),

    // Validate specific field
    validateField: useCallback((field: string, value: any) => {
      try {
        const fieldSchema = getFieldSchema(field);
        if (fieldSchema) {
          fieldSchema.parse(value);
          dispatch({ type: 'CLEAR_ERROR', field });
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          dispatch({ 
            type: 'SET_ERROR', 
            field, 
            errors: error.errors.map(e => e.message) 
          });
        }
      }
    }, []),

    // Save to persistence layer
    save: useCallback(async () => {
      if (options.onAutoSave) {
        await options.onAutoSave(state.data);
        dispatch({ type: 'MARK_SAVED' });
      }
    }, [options.onAutoSave, state.data]),

    // Clear persisted data
    clearSaved: useCallback(() => {
      if (options.persistKey && typeof window !== 'undefined') {
        localStorage.removeItem(`task-form-${options.persistKey}`);
      }
    }, [options.persistKey]),
  };

  return {
    state: updatedState,
    actions,
  };
}

/**
 * Get field-specific schema for validation
 */
function getFieldSchema(field: string): z.ZodSchema | null {
  const schema = taskCreateSchema;
  
  try {
    // This is a simplified approach - in practice, you'd want more sophisticated field extraction
    const fieldParts = field.split('.');
    let currentSchema = schema;
    
    for (const part of fieldParts) {
      if (currentSchema instanceof z.ZodObject) {
        currentSchema = currentSchema.shape[part];
      }
    }
    
    return currentSchema || null;
  } catch {
    return null;
  }
}

/**
 * Type exports
 */
export type TaskFormActions = ReturnType<typeof useTaskFormState>['actions'];
export type { TaskCreateData, TaskUpdateData };