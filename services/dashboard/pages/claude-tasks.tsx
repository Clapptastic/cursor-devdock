import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getTasks, submitTask, analyzeTaskComplexity, getNextTask, generateSubtasks, clearSubtasks, validateDependencies, fixDependencies, getComplexityReport, createResearchTask, importTasks, exportTasks } from '../lib/api';
import axios from 'axios';

// Task status badge component
const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>
      {status}
    </span>
  );
};

const ClaudeTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  const [complexityReport, setComplexityReport] = useState(null);
  const [showComplexityReport, setShowComplexityReport] = useState(false);
  const [showResearchForm, setShowResearchForm] = useState(false);
  const [researchPrompt, setResearchPrompt] = useState('');
  const [researchContext, setResearchContext] = useState('');
  const [showImportExport, setShowImportExport] = useState(false);
  const [importData, setImportData] = useState('');
  
  // New task form state
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    priority: 'normal',
    model: 'claude-3-opus-20240229',
    dependencies: '',
    context: '',
    apiKey: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dependencies, setDependencies] = useState([]);
  const [newDependency, setNewDependency] = useState('');

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
    
    // Check for saved API key in localStorage
    const savedApiKey = localStorage.getItem('anthropic_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setApiKeyInput(savedApiKey);
    }
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await getTasks();
      setTasks(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.prompt) {
      return;
    }

    try {
      setIsSubmitting(true);
      await submitTask({
        ...formData,
        apiKey: formData.apiKey || apiKey // Use form field or globally stored key
      });
      // Reset form
      setFormData({
        title: '',
        prompt: '',
        priority: 'normal',
        model: 'claude-3-opus-20240229',
        dependencies: '',
        context: '',
        apiKey: ''
      });
      setShowForm(false);
      // Refresh task list
      fetchTasks();
    } catch (err) {
      console.error('Error submitting task:', err);
      setError('Failed to submit task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Calculate task duration
  const calculateDuration = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    
    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${Math.round(durationMs / 1000)}s`;
    return `${Math.round(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s`;
  };

  // Analyze task complexity
  const handleAnalyzeComplexity = async () => {
    try {
      setLoading(true);
      const response = await analyzeTaskComplexity();
      setSelectedTask({
        ...selectedTask,
        complexityAnalysis: response.data
      });
      setError('');
    } catch (err) {
      console.error('Error analyzing task complexity:', err);
      setError('Failed to analyze task complexity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get next task
  const handleGetNextTask = async () => {
    try {
      setLoading(true);
      const response = await getNextTask();
      
      if (response.data.nextTask) {
        const nextTaskId = response.data.nextTask.id;
        const task = tasks.find(t => t.id === nextTaskId);
        if (task) {
          setSelectedTask(task);
        }
      } else {
        setError('No available tasks with satisfied dependencies.');
      }
    } catch (err) {
      console.error('Error getting next task:', err);
      setError('Failed to determine next task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSubtasks = async (taskId, numSubtasks = 3) => {
    try {
      setLoading(true);
      const response = await generateSubtasks(taskId, numSubtasks);
      
      // Update tasks list
      setTasks(tasks.map(task => 
        task.id === taskId ? response.data : task
      ));
      
      // Update selected task if needed
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(response.data);
      }
      
      setError('');
    } catch (err) {
      console.error('Error generating subtasks:', err);
      setError('Failed to generate subtasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSubtasks = async (taskId) => {
    try {
      setLoading(true);
      const response = await clearSubtasks(taskId);
      
      // Update tasks list
      setTasks(tasks.map(task => 
        task.id === taskId ? response.data : task
      ));
      
      // Update selected task if needed
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(response.data);
      }
      
      setError('');
    } catch (err) {
      console.error('Error clearing subtasks:', err);
      setError('Failed to clear subtasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle API key submission
  const handleApiKeySubmit = () => {
    if (!apiKeyInput.trim()) {
      setError("API key cannot be empty");
      return;
    }
    
    // Save the API key to localStorage for later use
    localStorage.setItem('anthropic_api_key', apiKeyInput);
    
    // Update the state with the new API key
    setApiKey(apiKeyInput);
    
    // Hide the API key modal
    setShowApiKey(false);
    
    // Clear any previous error
    setError('');
  };

  // Validate dependencies
  const handleValidateDependencies = async () => {
    try {
      setLoading(true);
      const response = await validateDependencies();
      
      if (response.data.valid) {
        setError('');
        alert('All task dependencies are valid.');
      } else {
        setSelectedTask({
          ...selectedTask,
          dependencyValidation: response.data
        });
        
        setError(`Found ${response.data.invalidTasks.length} tasks with invalid dependencies.`);
      }
    } catch (err) {
      console.error('Error validating dependencies:', err);
      setError('Failed to validate dependencies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fix dependencies
  const handleFixDependencies = async () => {
    try {
      setLoading(true);
      const response = await fixDependencies();
      
      if (response.data.fixed) {
        alert(`Fixed ${response.data.fixedTasks.length} tasks with dependency issues.`);
        fetchTasks(); // Refresh task list
      } else {
        alert('No dependency issues to fix.');
      }
      
      setError('');
    } catch (err) {
      console.error('Error fixing dependencies:', err);
      setError('Failed to fix dependencies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get complexity report
  const handleGetComplexityReport = async () => {
    try {
      setLoading(true);
      const response = await getComplexityReport();
      setComplexityReport(response.data);
      setShowComplexityReport(true);
      setError('');
    } catch (err) {
      console.error('Error getting complexity report:', err);
      setError('Failed to get complexity report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create research task
  const handleCreateResearchTask = async () => {
    if (!researchPrompt.trim()) {
      setError('Research prompt cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const response = await createResearchTask(researchPrompt, researchContext);
      
      // Add new task to the list
      setTasks([...tasks, response.data]);
      
      // Reset form
      setResearchPrompt('');
      setResearchContext('');
      setShowResearchForm(false);
      
      setError('');
    } catch (err) {
      console.error('Error creating research task:', err);
      setError('Failed to create research task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Import tasks
  const handleImportTasks = async () => {
    try {
      // Parse JSON input
      const tasksToImport = JSON.parse(importData);
      
      setLoading(true);
      const response = await importTasks(tasksToImport);
      
      if (response.data.success) {
        alert(`Successfully imported ${response.data.imported} tasks.`);
        fetchTasks(); // Refresh task list
        setImportData('');
        setShowImportExport(false);
      }
      
      setError('');
    } catch (err) {
      console.error('Error importing tasks:', err);
      setError('Failed to import tasks. Please ensure the JSON format is correct.');
    } finally {
      setLoading(false);
    }
  };

  // Export tasks
  const handleExportTasks = async () => {
    try {
      setLoading(true);
      const response = await exportTasks();
      
      // Format JSON for display
      setImportData(JSON.stringify(response.data.tasks, null, 2));
      setShowImportExport(true);
      
      setError('');
    } catch (err) {
      console.error('Error exporting tasks:', err);
      setError('Failed to export tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData) => {
    if (!taskData.title || !taskData.prompt) {
      setError("Task title and prompt cannot be empty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the stored API key if available
      const keyToUse = taskData.apiKey || apiKey || localStorage.getItem('anthropic_api_key');
      
      if (!keyToUse) {
        setShowApiKey(true);
        setApiKeyInput(''); // Clear the input field when showing the modal
        setError("API key is required to create a task");
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_CLAUDE_TASK_MASTER_URL || "http://localhost:8002"}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: taskData,
          apiKey: keyToUse,
          model: taskData.model
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTasks([...tasks, result]);
        setShowForm(false);
        fetchTasks();
        setError(''); // Clear any error messages
      } else {
        setError('Failed to create task. Please try again later.');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await clearSubtasks(taskId);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const runTask = async (taskId) => {
    try {
      setActionLoading(prev => ({...prev, [taskId]: true}));
      await submitTask({ ...selectedTask, _id: taskId });
      fetchTasks();
    } catch (error) {
      console.error('Error running task:', error);
      setError('Failed to run task. Please try again.');
    } finally {
      setActionLoading(prev => ({...prev, [taskId]: false}));
    }
  };

  const formatModelName = (model) => {
    return model.split('-').map(part => 
      isNaN(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part
    ).join(' ');
  };

  // Filter and sort tasks
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }
    
    // Search term filter (search in title and id)
    if (searchTerm && !((task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        task.id.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by priority first (high to low)
    const priorityA = parseInt(a.priority || '1');
    const priorityB = parseInt(b.priority || '1');
    
    if (priorityB !== priorityA) {
      return priorityB - priorityA;
    }
    
    // Then by status (pending, in-progress, completed, failed)
    const statusOrder = { 'in-progress': 0, 'pending': 1, 'completed': 2, 'failed': 3 };
    const statusA = statusOrder[a.status] || 4;
    const statusB = statusOrder[b.status] || 4;
    
    if (statusA !== statusB) {
      return statusA - statusB;
    }
    
    // Finally by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Claude Task Master - Cursor DevDock</title>
      </Head>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claude Task Master</h1>
          <div className="flex items-center text-gray-600">
            <p>Manage and monitor AI tasks</p>
            <Link href="/docs/task-master-features">
              <a className="inline-flex items-center text-blue-600 hover:text-blue-800 ml-2 text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded">
                <span>Documentation</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-expanded={showForm}
          >
            {showForm ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Task
              </>
            )}
          </button>
          <button 
            onClick={handleGetNextTask} 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Find Next Task
              </>
            )}
          </button>
          <button 
            onClick={handleAnalyzeComplexity} 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0zM12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
                Analyze Complexity
              </>
            )}
          </button>
          <button 
            onClick={() => setShowResearchForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Researching...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" clipRule="evenodd" />
                </svg>
                Research Task
              </>
            )}
          </button>
          <button 
            onClick={() => setShowComplexityReport(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0zM12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
                Complexity Report
              </>
            )}
          </button>
          <div className="flex space-x-2">
            <Link href="/docs">
              <a className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Docs
              </a>
            </Link>
            <Link href="/">
              <a className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Dashboard
              </a>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md" role="alert" aria-live="assertive">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Create New Task</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      id="task-title"
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Task title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="task-prompt" className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                    <textarea
                      id="task-prompt"
                      required
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter your prompt for Claude..."
                      value={formData.prompt}
                      onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    ></textarea>
                    <p className="mt-1 text-xs text-gray-500">
                      Be specific in your instructions to get the best results
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="task-context" className="block text-sm font-medium text-gray-700 mb-1">Context (Optional)</label>
                    <textarea
                      id="task-context"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Additional context information..."
                      value={formData.context}
                      onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                    ></textarea>
                    <p className="mt-1 text-xs text-gray-500">
                      Provide any relevant background information to help Claude understand the task
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
                      Anthropic API Key
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="api-key"
                        type={showApiKey ? "text" : "password"}
                        required={!apiKey} 
                        className={`w-full px-3 py-2 border ${!formData.apiKey && !apiKey && error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                        placeholder={apiKey ? "Using saved API key" : "Enter your Anthropic API key"}
                        value={formData.apiKey}
                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      />
                      <button 
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="mt-1 flex items-center">
                      <input
                        id="save-api-key"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={formData.apiKey !== ''}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Do nothing if already has a value
                            if (formData.apiKey === '') {
                              setFormData({ ...formData, apiKey: apiKey || '' });
                            }
                          } else {
                            setFormData({ ...formData, apiKey: '' });
                          }
                        }}
                      />
                      <label htmlFor="save-api-key" className="ml-2 block text-xs text-gray-600">
                        {apiKey ? "Use a different API key for this task" : "Save API key for future tasks"}
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Your API key is required to use Claude and will be securely transmitted
                    </p>
                    {!formData.apiKey && !apiKey && error && (
                      <p className="mt-1 text-xs text-red-500">
                        {error === "Task cannot be empty" ? "API key is required" : error}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="task-model" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                      <select
                        id="task-model"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      >
                        <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                        <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                        <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                        <option value="claude-2.1">Claude 2.1</option>
                        <option value="claude-2.0">Claude 2.0</option>
                        <option value="claude-instant-1.2">Claude Instant 1.2</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <div className="flex items-center space-x-4">
                        {[1, 2, 3, 4].map((priority) => (
                          <label key={priority} className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                              name="priority"
                              value={priority}
                              checked={formData.priority === String(priority)}
                              onChange={() => setFormData({ ...formData, priority: String(priority) })}
                            />
                            <div className="ml-2 flex items-center">
                              {[...Array(priority)].map((_, i) => (
                                <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </label>
                        ))}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {formData.priority === '4' ? 'Critical - Highest priority task' : 
                         formData.priority === '3' ? 'High - Important task' :
                         formData.priority === '2' ? 'Medium - Standard priority' : 'Low - Non-urgent task'}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dependencies (Optional)</label>
                    <div className="flex flex-wrap gap-2 bg-gray-50 p-2 rounded-md min-h-10">
                      {dependencies.map((dependency, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {dependency}
                          <button
                            type="button"
                            onClick={() => setDependencies(dependencies.filter((_, i) => i !== index))}
                            className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:text-blue-600 focus:outline-none"
                          >
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </span>
                      ))}
                      {dependencies.length === 0 && (
                        <span className="text-xs text-gray-500 italic">No dependencies added</span>
                      )}
                    </div>
                    
                    <div className="mt-2 flex">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter task ID"
                        value={newDependency}
                        onChange={(e) => setNewDependency(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newDependency && !dependencies.includes(newDependency)) {
                            setDependencies([...dependencies, newDependency]);
                            setNewDependency('');
                          }
                        }}
                        className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Add
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Add task IDs that must be completed before this task runs
                    </p>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!formData.title || !formData.prompt || (!formData.apiKey && !apiKey) || isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Task"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-gray-900">Claude Tasks</h2>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <label htmlFor="status-filter" className="text-sm text-gray-600">Status:</label>
              <select
                id="status-filter"
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm"
                onChange={(e) => setStatusFilter(e.target.value)}
                value={statusFilter}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div className="relative">
              <input
                type="text"
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm pl-8"
                placeholder="Search tasks..."
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setShowForm(true)}
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Task
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2 text-gray-600">No tasks found</p>
            <button
              className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setShowForm(true)}
            >
              Create your first task
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr 
                    key={task.id} 
                    className="hover:bg-gray-50 cursor-pointer" 
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskDetails(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {task.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {task.title || "Untitled Task"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'}`}
                      >
                        {task.status === 'completed' ? (
                          <svg className="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                        ) : task.status === 'in-progress' ? (
                          <svg className="mr-1.5 h-2 w-2 text-blue-400 animate-pulse" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                        ) : task.status === 'failed' ? (
                          <svg className="mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                        ) : (
                          <svg className="mr-1.5 h-2 w-2 text-gray-400" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                        )}
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {[...Array(parseInt(task.priority || '1'))].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400 inline" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatModelName(task.model || 'claude-3-sonnet-20240229')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(task.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          className={`text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 p-1 rounded ${
                            task.status !== 'pending' || actionLoading[task.id] ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (task.status === 'pending' && !actionLoading[task.id]) {
                              runTask(task.id);
                            }
                          }}
                          disabled={task.status !== 'pending' || actionLoading[task.id]}
                          aria-label="Run task"
                        >
                          {actionLoading[task.id] ? (
                            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 p-1 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                          }}
                          aria-label="Delete task"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* API Key Modal */}
      {showApiKey && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Enter Anthropic API Key</h3>
              <button
                onClick={() => {
                  setShowApiKey(false);
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md" role="alert">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    id="api-key-input"
                    type="password"
                    className="block w-full pr-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your Anthropic API key"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Your API key is required to use Claude and will be securely stored in your browser.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowApiKey(false);
                  setError('');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApiKeySubmit}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save API Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details */}
      {selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setSelectedTask(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                Task Details
                <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedTask.status === 'completed' ? 'bg-green-100 text-green-800' : 
                  selectedTask.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                  selectedTask.status === 'failed' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedTask.status === 'in-progress' ? 'In Progress' : 
                   selectedTask.status === 'completed' ? 'Completed' : 
                   selectedTask.status === 'failed' ? 'Failed' : 
                   'Pending'}
                </span>
              </h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">ID</h4>
                    <p className="text-sm text-gray-900">{selectedTask._id}</p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Title</h4>
                    <p className="text-sm text-gray-900 font-medium">{selectedTask.title}</p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Created</h4>
                    <p className="text-sm text-gray-900">{new Date(selectedTask.created_at).toLocaleString()}</p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Priority</h4>
                    <div className="flex items-center">
                      {[...Array(Number(selectedTask.priority) || 1)].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-sm text-gray-700">
                        {selectedTask.priority === '4' ? 'Critical' : 
                         selectedTask.priority === '3' ? 'High' :
                         selectedTask.priority === '2' ? 'Medium' : 'Low'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Model</h4>
                    <p className="text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {selectedTask.model || 'Default'}
                      </span>
                    </p>
                  </div>
                  
                  {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Dependencies</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.dependencies.map((depId, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {depId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Prompt</h4>
                    <div className="bg-gray-50 rounded-md p-3 max-h-60 overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap">{selectedTask.prompt}</pre>
                    </div>
                  </div>
                  
                  {selectedTask.context && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Context</h4>
                      <div className="bg-gray-50 rounded-md p-3 max-h-60 overflow-y-auto">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap">{selectedTask.context}</pre>
                      </div>
                    </div>
                  )}
                  
                  {selectedTask.result && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Result</h4>
                      <div className="bg-gray-50 rounded-md p-3 max-h-60 overflow-y-auto">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap">{selectedTask.result}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedTask.error && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-red-500 mb-1">Error</h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-40 overflow-y-auto">
                    <pre className="text-sm text-red-800 whitespace-pre-wrap">{selectedTask.error}</pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
              {(selectedTask.status === 'pending' || selectedTask.status === 'failed') && (
                <button
                  onClick={() => {
                    runTask(selectedTask._id);
                    setSelectedTask(null);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  disabled={actionLoading[selectedTask._id]}
                >
                  {actionLoading[selectedTask._id] ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" clipRule="evenodd" />
                      </svg>
                      Run Task
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => setSelectedTask(null)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Research Task Form Modal */}
      {showResearchForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Create Research-Backed Task</h3>
              <button 
                onClick={() => setShowResearchForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="research-prompt" className="block text-sm font-medium text-gray-700">Research Prompt *</label>
                  <textarea
                    id="research-prompt"
                    value={researchPrompt}
                    onChange={(e) => setResearchPrompt(e.target.value)}
                    placeholder="Describe what you need to research..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="research-context" className="block text-sm font-medium text-gray-700">Additional Context</label>
                  <textarea
                    id="research-context"
                    value={researchContext}
                    onChange={(e) => setResearchContext(e.target.value)}
                    placeholder="Provide any additional context for the research..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowResearchForm(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateResearchTask}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Research Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complexity Report Modal */}
      {showComplexityReport && complexityReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-medium text-gray-900">Task Complexity Analysis</h3>
              <button 
                onClick={() => setShowComplexityReport(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm text-gray-500">High Complexity Tasks</span>
                  <p className="text-2xl font-semibold text-red-600">{complexityReport.complexityDistribution.high}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm text-gray-500">Medium Complexity Tasks</span>
                  <p className="text-2xl font-semibold text-amber-600">{complexityReport.complexityDistribution.medium}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm text-gray-500">Low Complexity Tasks</span>
                  <p className="text-2xl font-semibold text-green-600">{complexityReport.complexityDistribution.low}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm text-gray-500">Average Complexity</span>
                  <p className="text-2xl font-semibold text-blue-600">{complexityReport.summary.averageComplexity.toFixed(2)}</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm md:col-span-2">
                  <span className="text-sm text-gray-500">Tasks Needing Breakdown</span>
                  <p className="text-2xl font-semibold text-purple-600">{complexityReport.summary.tasksNeedingBreakdown}</p>
                </div>
              </div>
              
              {complexityReport.highComplexityTasks.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3 pb-2 border-b">High Complexity Tasks</h4>
                  <div className="space-y-3">
                    {complexityReport.highComplexityTasks.map(task => (
                      <div key={task.taskId} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{task.title}</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Complexity: {task.complexity}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            {task.hasExistingSubtasks ? 'Has subtasks' : 'No subtasks'}
                          </span>
                          <button
                            onClick={() => {
                              handleGenerateSubtasks(task.taskId, task.recommendedSubtasks);
                              setShowComplexityReport(false);
                            }}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                          >
                            Generate {task.recommendedSubtasks} Subtasks
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {complexityReport.mediumComplexityTasks.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3 pb-2 border-b">Medium Complexity Tasks</h4>
                  <div className="space-y-3">
                    {complexityReport.mediumComplexityTasks.map(task => (
                      <div key={task.taskId} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{task.title}</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Complexity: {task.complexity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowComplexityReport(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import/Export Modal */}
      {showImportExport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Import/Export Tasks</h3>
              <button 
                onClick={() => setShowImportExport(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste tasks JSON here for import..."
                className="w-full h-80 font-mono text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowImportExport(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleExportTasks}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Export All
              </button>
              <button
                onClick={handleImportTasks}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                {loading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaudeTasks;

// Add getServerSideProps to ensure the page is always server-side rendered
export async function getServerSideProps() {
  return {
    props: {
      // Adding a timestamp ensures the page is not cached
      timestamp: new Date().toISOString(),
    },
  };
} 