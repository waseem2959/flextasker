/**
 * TaskDetailView Component with Enhanced TypeScript Patterns
 * 
 * This component showcases how to properly handle different task states
 * using TypeScript's discriminated union pattern and type guards.
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Task } from "@/types";
import { TaskStatus } from "@/types/enums";
import { ensureDiscriminatedTask } from "@/utils/type-adapters";
import { 
  isOpenTask, 
  isCompletedTask, 
  isInProgressTask, 
  isCancelledTask, 
  isDisputedTask 
} from "@/utils/type-guards";
import { formatDistanceToNow } from "date-fns";
import { Calendar, Clock, MapPin, CheckCircle, AlertTriangle, X } from "lucide-react";
import TaskStatusBadge from "./TaskStatusBadge";

interface TaskDetailViewProps {
  task: Task;
  onAcceptBid?: (bidId: string) => void;
  onCompleteTask?: () => void;
  onCancelTask?: () => void;
  onMarkInProgress?: () => void;
}

/**
 * Renders task details with type-safe rendering based on task status
 * using discriminated unions and type guards
 */
export const TaskDetailView: React.FC<TaskDetailViewProps> = ({
  task: regularTask,
  onAcceptBid,
  onCompleteTask,
  onCancelTask,
  onMarkInProgress
}) => {
  // Convert to discriminated union format for better type safety
  const task = ensureDiscriminatedTask(regularTask);

  // Render different UI elements based on task status
  // TypeScript will know exactly which properties are available for each status
  const renderStatusSpecificDetails = () => {
    if (isOpenTask(task)) {
      return (
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <h3 className="font-semibold flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Open for Bids
          </h3>
          <p className="text-sm mt-2">
            This task is open and accepting bids until{" "}
            {task.bidEndDate ? formatDistanceToNow(task.bidEndDate, { addSuffix: true }) : "the deadline"}
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm">
              Place a Bid
            </Button>
          </div>
        </div>
      );
    }

    if (isInProgressTask(task)) {
      return (
        <div className="mt-4 p-4 bg-yellow-50 rounded-md">
          <h3 className="font-semibold flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            In Progress
          </h3>
          <p className="text-sm mt-2">
            Work on this task began {formatDistanceToNow(task.startDate || new Date(), { addSuffix: true })}
          </p>
          {task.assignee && (
            <p className="text-sm mt-2">
              Being handled by: {task.assignee.firstName} {task.assignee.lastName}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            {onCompleteTask && (
              <Button size="sm" onClick={onCompleteTask}>
                Mark Complete
              </Button>
            )}
            {onCancelTask && (
              <Button variant="outline" size="sm" onClick={onCancelTask}>
                Cancel Task
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (isCompletedTask(task)) {
      return (
        <div className="mt-4 p-4 bg-green-50 rounded-md">
          <h3 className="font-semibold flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Completed
          </h3>
          <p className="text-sm mt-2">
            This task was completed {formatDistanceToNow(task.completionDate, { addSuffix: true })}
          </p>
          {task.assignee && (
            <p className="text-sm mt-2">
              Completed by: {task.assignee.firstName} {task.assignee.lastName}
            </p>
          )}
        </div>
      );
    }

    if (isCancelledTask(task)) {
      return (
        <div className="mt-4 p-4 bg-red-50 rounded-md">
          <h3 className="font-semibold flex items-center">
            <X className="w-4 h-4 mr-2" />
            Cancelled
          </h3>
          <p className="text-sm mt-2">
            This task was cancelled {formatDistanceToNow(task.cancelledAt, { addSuffix: true })}
          </p>
          {task.cancellationReason && (
            <p className="text-sm mt-2">
              Reason: {task.cancellationReason}
            </p>
          )}
        </div>
      );
    }

    if (isDisputedTask(task)) {
      return (
        <div className="mt-4 p-4 bg-purple-50 rounded-md">
          <h3 className="font-semibold flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Disputed
          </h3>
          <p className="text-sm mt-2">
            This task is currently in dispute
          </p>
          {task.disputeReason && (
            <p className="text-sm mt-2">
              Reason: {task.disputeReason}
            </p>
          )}
        </div>
      );
    }

    // Default case
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{task.title}</h2>
        <TaskStatusBadge status={task.status} />
      </div>

      <div className="mb-4">
        <p className="text-gray-700">{task.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="font-semibold mb-2">Details</h3>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Posted {formatDistanceToNow(task.createdAt, { addSuffix: true })}</span>
            </div>

            <div className="flex items-center text-sm">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{task.location.isRemote ? "Remote" : task.location.address || "On Location"}</span>
            </div>

            <div className="flex items-center text-sm">
              <span className="font-medium">Category:</span>
              <span className="ml-2">{task.category.name}</span>
            </div>

            <div className="flex items-center text-sm">
              <span className="font-medium">Budget:</span>
              <span className="ml-2">
                ${task.budget.amount.toFixed(2)} ({task.budget.type})
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Posted by</h3>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
              {task.creator.firstName.charAt(0)}
              {task.creator.lastName.charAt(0)}
            </div>
            <div>
              <p className="font-medium">
                {task.creator.firstName} {task.creator.lastName}
              </p>
              <p className="text-sm text-gray-500">
                Member since {formatDistanceToNow(task.creator.createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status-specific content using our discriminated union pattern */}
      {renderStatusSpecificDetails()}
    </Card>
  );
};

export default TaskDetailView;
