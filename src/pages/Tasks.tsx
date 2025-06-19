
import { Layout } from '../components/layout/layout';
import { TaskList } from '../components/task/task-list';
import { CATEGORIES, TASKS } from '../data/mock-data';
import { SEO } from '../utils/seo';

const Tasks = () => {
  const categoryNames = CATEGORIES.map(cat => cat.name);

  return (
    <Layout>
      <SEO
        title="Browse Tasks | Find Work & Earn Money | Flextasker"
        description="Browse available tasks in your area and start earning money today. From home services to digital tasks, find work that matches your skills on Flextasker."
        canonicalUrl="https://flextasker.com/tasks"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Available Tasks',
          description: 'Browse and apply for tasks posted by people in your area',
          url: 'https://flextasker.com/tasks'
        }}
      />
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
