import React, { useState, useEffect } from 'react';

interface TodoProps {
  title?: string;
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const Todo: React.FC<TodoProps> = ({ title = 'Todo List' }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [error, setError] = useState('');

  // Load todos from localStorage on initial render
  useEffect(() => {
    try {
      const savedTodos = localStorage.getItem('todos');
      if (savedTodos) {
        // Parse the string and convert date strings back to Date objects
        const parsedTodos = JSON.parse(savedTodos).map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt)
        }));
        setTodos(parsedTodos);
      }
    } catch (err) {
      console.error('Error loading todos from localStorage:', err);
      setError('Failed to load saved todos');
    }
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('todos', JSON.stringify(todos));
    } catch (err) {
      console.error('Error saving todos to localStorage:', err);
      setError('Failed to save todos');
    }
  }, [todos]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) {
      setError('Todo text cannot be empty');
      return;
    }

    const newTodoItem: TodoItem = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      completed: false,
      createdAt: new Date()
    };

    setTodos([...todos, newTodoItem]);
    setNewTodo('');
    setError('');
  };

  const handleToggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleClearCompleted = () => {
    setTodos(todos.filter((todo) => !todo.completed));
  };

  // Format the date to a readable string
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="todo-container">
      <h3>{title}</h3>
      
      <form onSubmit={handleAddTodo} className="todo-input-container">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
          className="todo-input"
        />
        <button type="submit" className="todo-add-button">Add</button>
      </form>
      
      {error && <div className="todo-error">{error}</div>}
      
      <ul className="todo-list">
        {todos.length === 0 ? (
          <li className="todo-empty">No tasks yet. Add some!</li>
        ) : (
          todos.map((todo) => (
            <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <div className="todo-item-content">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo.id)}
                  className="todo-checkbox"
                />
                <span className="todo-text">{todo.text}</span>
                <span className="todo-date">{formatDate(todo.createdAt)}</span>
              </div>
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="todo-delete-button"
              >
                Delete
              </button>
            </li>
          ))
        )}
      </ul>
      
      {todos.some(todo => todo.completed) && (
        <div className="todo-actions">
          <button onClick={handleClearCompleted} className="todo-clear-button">
            Clear Completed
          </button>
        </div>
      )}
      
      <style jsx>{`
        .todo-container {
          margin: 1rem 0;
          padding: 1rem;
          border-radius: 0.5rem;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
        }
        
        .todo-input-container {
          display: flex;
          margin-bottom: 1rem;
        }
        
        .todo-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem 0 0 0.25rem;
          font-size: 1rem;
        }
        
        .todo-add-button {
          padding: 0.5rem 1rem;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 0 0.25rem 0.25rem 0;
          cursor: pointer;
          font-weight: 500;
        }
        
        .todo-add-button:hover {
          background-color: #2563eb;
        }
        
        .todo-error {
          color: #ef4444;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        
        .todo-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .todo-empty {
          color: #6b7280;
          text-align: center;
          padding: 1rem;
          border: 1px dashed #d1d5db;
          border-radius: 0.25rem;
        }
        
        .todo-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .todo-item:last-child {
          border-bottom: none;
        }
        
        .todo-item.completed .todo-text {
          text-decoration: line-through;
          color: #6b7280;
        }
        
        .todo-item-content {
          display: flex;
          align-items: center;
          flex: 1;
        }
        
        .todo-checkbox {
          margin-right: 0.75rem;
        }
        
        .todo-text {
          flex: 1;
        }
        
        .todo-date {
          font-size: 0.75rem;
          color: #6b7280;
          margin-left: 0.5rem;
        }
        
        .todo-delete-button {
          padding: 0.25rem 0.5rem;
          background-color: #ef4444;
          color: white;
          border: none;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          cursor: pointer;
        }
        
        .todo-delete-button:hover {
          background-color: #dc2626;
        }
        
        .todo-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
        }
        
        .todo-clear-button {
          padding: 0.5rem 1rem;
          background-color: #6b7280;
          color: white;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .todo-clear-button:hover {
          background-color: #4b5563;
        }
      `}</style>
    </div>
  );
};

export default Todo; 