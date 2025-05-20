
import React from 'react';
import { Layout } from '../components/layout/Layout';
import { TASKS, CATEGORIES } from '../data/mockData';
import { TaskList } from '../components/task/TaskList';

const Tasks = () => {
  const categoryNames = CATEGORIES.map(cat => cat.name);

  return (
    <Layout>
      <div className="py-10 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Find Tasks Near You
            </h1>
            <p className="mt-4 text-xl text-gray-500">
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
