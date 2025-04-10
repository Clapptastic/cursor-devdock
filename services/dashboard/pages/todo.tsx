import React from 'react';
import Todo from '../components/Todo';

const TodoPage: React.FC = () => {
  return (
    <div className="todo-page">
      <h1 className="page-title">Task Manager</h1>
      <p className="page-description">
        Manage your development tasks and track your progress.
      </p>
      
      <div className="todo-container">
        <Todo title="My Development Tasks" />
      </div>
      
      <style jsx>{`
        .todo-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 1rem;
        }
        
        .page-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #1a1a2e;
        }
        
        .page-description {
          color: #555;
          margin-bottom: 2rem;
        }
        
        .todo-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
        }
      `}</style>
    </div>
  );
};

export default TodoPage; 