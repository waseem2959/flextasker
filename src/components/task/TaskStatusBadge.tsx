/**
 * Task Status Badge Component with TypeScript Improvements
 * 
 * This component renders a status badge for tasks with proper typing and
 * visual styling based on the task status.
 */

import { Badge } from '@/components/ui/badge';
import { TaskStatus } from '@/types/enums';

interface TaskStatusBadgeProps {
  status: TaskStatus;
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
  // Determine styling based on status
  const getStatusStyles = () => {
    switch (status) {
      case TaskStatus.OPEN:
        return "bg-blue-500";
      case TaskStatus.IN_PROGRESS:
        return "bg-yellow-500";
      case TaskStatus.COMPLETED:
        return "bg-green-500";
      case TaskStatus.CANCELLED:
        return "bg-red-500";
      case TaskStatus.DISPUTED:
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get formatted status label
  const getStatusLabel = () => {
    switch (status) {
      case TaskStatus.IN_PROGRESS:
        return "In Progress";
      default:
        // Capitalize first letter of status
        return status.charAt(0) + status.slice(1).toLowerCase();
    }
  };

  return (
    <Badge className={getStatusStyles()}>
      {getStatusLabel()}
    </Badge>
  );
};

export default TaskStatusBadge;
