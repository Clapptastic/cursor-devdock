import React from 'react';
import Head from 'next/head';
import Todo from '../components/Todo';

const TodoPage: React.FC = () => {
  return (
    <div className="container">
      <Head>
        <title>Todo List - MCP Dashboard</title>
        <meta name="description" content="Task management for MCP Dashboard" />
      </Head>

      <main className="main">
        <h1 className="title">Task Management</h1>
        
        <p className="description">
          Manage your development tasks and track your progress
        </p>

        <div className="todo-wrapper">
          <Todo title="My Development Tasks" />
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 2rem;
        }

        .main {
          padding: 4rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 2.5rem;
          text-align: center;
        }

        .description {
          margin: 1rem 0;
          line-height: 1.5;
          font-size: 1.25rem;
          text-align: center;
          color: #6b7280;
        }

        .todo-wrapper {
          width: 100%;
          max-width: 600px;
          margin-top: 2rem;
        }
      `}</style>
    </div>
  );
};

export default TodoPage; 