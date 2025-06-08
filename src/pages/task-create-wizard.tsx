
import { TaskCreationWizard } from '@/components/task/task-creation-wizard';
// Removed unused main layout

const TaskCreateWizard = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-4">Create a New Task</h1>
            <p className="text-xl text-text-secondary">
              Follow our simple wizard to post your task and get competitive bids from skilled professionals.
            </p>
          </div>
          
          <TaskCreationWizard />
        </div>
      </div>
    </div>
  );
};

export default TaskCreateWizard;
