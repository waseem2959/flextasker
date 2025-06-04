/**
 * Task Status Badge Component with TypeScript Improvements
 * 
 * This component renders a status badge for tasks with proper typing and
 * visual styling based on the task status.
 */

import { Badge } from '@/components/ui/badge';
import { BadgeVariant } from '@/types/ui-types';
import { TaskStatus } from '../../../shared/types/enums';

// Utility functions for enum display (replacing deprecated EnumUtils)
const EnumUtils = {
  toDisplayText: (status: TaskStatus | string): string => {
    const statusStr = String(status);
    return statusStr.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase());
  },
  getTaskStatusLabel: (status: TaskStatus): string => {
    const statusStr = String(status);
    return statusStr.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase());
  }
};

interface TaskStatusBadgeProps {
  status: TaskStatus | string;
}

/**
 * TaskStatusBadge component for displaying task status with appropriate styling
 * 
 * @example
 * ```tsx
 * <TaskStatusBadge status={task.status} />
 * ```
 */
export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status }) => {
  // Determine badge variant based on status
  const getStatusVariant = (): BadgeVariant => {
    if (status === TaskStatus.OPEN) {
      return "default"; // primary color
    } else if (status === TaskStatus.IN_PROGRESS) {
      return "warning"; // warning color
    } else if (status === TaskStatus.COMPLETED) {
      return "success"; // success color
    } else if (status === TaskStatus.CANCELLED) {
      return "destructive"; // error color
    } else if (status === TaskStatus.DISPUTED) {
      return "secondary"; // accent color
    }
    return "outline"; // default fallback
  };

  // Get formatted status label
  const getStatusLabel = () => {
    // Use the EnumUtils function to get a properly formatted display text
    return EnumUtils.toDisplayText(status);
  };

  return (
    <Badge variant={getStatusVariant()}>
      {getStatusLabel()}
    </Badge>
  );
};

export default TaskStatusBadge;
