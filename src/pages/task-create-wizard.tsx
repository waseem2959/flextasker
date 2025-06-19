
import { UnifiedTaskWizard } from '@/components/task/unified-task-wizard';

const TaskCreateWizard = () => {
  const mockCategories = [
    { id: '1', name: 'Web Development' },
    { id: '2', name: 'Design' },
    { id: '3', name: 'Writing' },
    { id: '4', name: 'Marketing' }
  ];

  return <UnifiedTaskWizard categories={mockCategories} />;
};

export default TaskCreateWizard;
