
import { Layout } from '../components/layout/Layout';
import { TaskList } from '../components/task/task-list';
import { CATEGORIES, TASKS } from '../data/mock-data';

const Tasks = () => {
  const categoryNames = CATEGORIES.map(cat => cat.name);

  return (
    <Layout>
      <div className="py-10 bg-white min-h-screen font-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-[hsl(206,33%,16%)] sm:text-4xl font-primary">
              Find Tasks Near You
            </h1>
            <p className="mt-4 text-xl text-[hsl(220,14%,46%)] font-primary">
              Browse available tasks and place your bid today
            </p>
          </div>
          
          <TaskList 
            tasks={TASKS} 
            title="Available Tasks"
            categories={categoryNames}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Tasks;
