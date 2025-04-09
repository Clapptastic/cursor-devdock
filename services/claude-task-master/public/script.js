// Task Master UI Utilities
const TaskMaster = {
  // Configuration
  config: {
    polling: {
      enabled: true,
      interval: 5000 // Poll for updates every 5 seconds
    },
    animation: {
      enabled: true,
      duration: 300
    }
  },
  
  // State
  state: {
    tasks: [],
    activeTaskId: null,
    pollingTimeout: null,
    filters: {
      search: '',
      status: 'all'
    }
  },
  
  // Initialize the app
  init() {
    this.bindEvents();
    this.fetchTasks();
    
    if (this.config.polling.enabled) {
      this.startPolling();
    }
    
    // Set focus on the task description field
    document.getElementById('task').focus();
  },
  
  // Bind UI events
  bindEvents() {
    // These are wired in the HTML directly, this is just for documentation
    // - Form submission
    // - Task filtering
    // - Task viewing
    // - Modal controls
    
    // Additional event listeners
    document.addEventListener('keydown', e => {
      // Close modal on ESC key
      if (e.key === 'Escape') {
        const modal = document.getElementById('task-modal');
        if (!modal.classList.contains('hidden')) {
          closeModal();
        }
      }
    });
  },
  
  // Start polling for task updates
  startPolling() {
    // Clear any existing polling
    if (this.state.pollingTimeout) {
      clearTimeout(this.state.pollingTimeout);
    }
    
    // Set up polling
    this.state.pollingTimeout = setInterval(() => {
      this.pollTaskUpdates();
    }, this.config.polling.interval);
  },
  
  // Stop polling
  stopPolling() {
    if (this.state.pollingTimeout) {
      clearTimeout(this.state.pollingTimeout);
      this.state.pollingTimeout = null;
    }
  },
  
  // Poll for updates to tasks
  pollTaskUpdates() {
    // Only poll for tasks with pending or processing status
    const tasksPending = this.state.tasks.filter(
      task => task.status === 'pending' || task.status === 'processing' || task.status === 'in_progress'
    );
    
    if (tasksPending.length === 0) {
      return; // No tasks to update
    }
    
    // Check for updates on each pending task
    tasksPending.forEach(task => {
      fetch(`/api/tasks/${task.id}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch task update');
          }
          return response.json();
        })
        .then(updatedTask => {
          // If status changed, update the UI
          if (updatedTask.status !== task.status) {
            this.updateTaskInList(updatedTask);
            
            // Show notification for completed tasks
            if (updatedTask.status === 'completed') {
              showToast(`Task "${updatedTask.title}" completed!`, 'success');
            } else if (updatedTask.status === 'failed') {
              showToast(`Task "${updatedTask.title}" failed.`, 'error');
            }
            
            // If the task detail modal is open for this task, update it
            if (this.state.activeTaskId === updatedTask.id) {
              this.updateTaskDetailModal(updatedTask);
            }
          }
        })
        .catch(error => {
          console.error('Error polling task update:', error);
        });
    });
  },
  
  // Update a task in the task list
  updateTaskInList(updatedTask) {
    // Find the task in our state and update it
    const index = this.state.tasks.findIndex(t => t.id === updatedTask.id);
    if (index >= 0) {
      this.state.tasks[index] = updatedTask;
    }
    
    // Find the task item in the DOM
    const taskItem = document.querySelector(`.task-item[data-task-id="${updatedTask.id}"]`);
    if (!taskItem) return;
    
    // Status badge
    let statusClass, statusIcon;
    switch(updatedTask.status) {
      case 'completed':
        statusClass = 'bg-green-100 text-green-800';
        statusIcon = 'fa-check-circle';
        break;
      case 'processing':
      case 'in_progress':
        statusClass = 'bg-blue-100 text-blue-800';
        statusIcon = 'fa-spinner fa-spin';
        break;
      case 'failed':
        statusClass = 'bg-red-100 text-red-800';
        statusIcon = 'fa-exclamation-circle';
        break;
      default:
        statusClass = 'bg-yellow-100 text-yellow-800';
        statusIcon = 'fa-clock';
    }
    
    // Update status badge
    const statusBadge = taskItem.querySelector('.rounded-full');
    if (statusBadge) {
      // Remove old classes and add new ones
      statusBadge.className = `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusClass}`;
      
      // Update icon and text
      statusBadge.innerHTML = `<i class="fas ${statusIcon} mr-1"></i>${updatedTask.status}`;
    }
  },
  
  // Update the task detail modal if it's open
  updateTaskDetailModal(task) {
    if (!this.state.activeTaskId || this.state.activeTaskId !== task.id) return;
    
    const modalContent = document.getElementById('modal-content');
    if (!modalContent) return;
    
    // Similar to viewTaskDetails function
    let statusClass;
    switch(task.status) {
      case 'completed':
        statusClass = 'bg-green-100 text-green-800';
        break;
      case 'processing':
      case 'in_progress':
        statusClass = 'bg-blue-100 text-blue-800';
        break;
      case 'failed':
        statusClass = 'bg-red-100 text-red-800';
        break;
      default:
        statusClass = 'bg-yellow-100 text-yellow-800';
    }
    
    // Format dates nicely
    const createdAt = task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A';
    const startedAt = task.startedAt ? new Date(task.startedAt).toLocaleString() : 'N/A';
    const completedAt = task.completedAt ? new Date(task.completedAt).toLocaleString() : 'N/A';
    
    document.getElementById('modal-title').innerText = `Task ${task.id}`;
    
    modalContent.innerHTML = `
      <div class="mb-6">
        <div class="flex flex-wrap gap-2 mb-4">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClass}">
            ${task.status}
          </span>
          ${task.model ? `
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              <i class="fas fa-microchip mr-1"></i> ${task.model}
            </span>
          ` : ''}
          ${task.priority ? `
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
              <i class="fas fa-flag mr-1"></i> ${task.priority}
            </span>
          ` : ''}
        </div>
        
        <h3 class="text-lg font-semibold mb-2">Task Description</h3>
        <div class="bg-gray-50 p-4 rounded-lg mb-4 whitespace-pre-wrap">
          ${task.prompt || task.task}
        </div>
        
        ${task.context ? `
          <h3 class="text-lg font-semibold mb-2">Context</h3>
          <div class="bg-gray-50 p-4 rounded-lg mb-4 whitespace-pre-wrap">
            ${task.context}
          </div>
        ` : ''}
        
        ${task.response ? `
          <h3 class="text-lg font-semibold mb-2">Response</h3>
          <div class="bg-gray-50 p-4 rounded-lg mb-4 whitespace-pre-wrap">
            ${task.response}
          </div>
        ` : ''}
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div class="bg-gray-50 p-3 rounded-lg">
            <p class="text-gray-500 mb-1">Created</p>
            <p class="font-medium">${createdAt}</p>
          </div>
          <div class="bg-gray-50 p-3 rounded-lg">
            <p class="text-gray-500 mb-1">Started</p>
            <p class="font-medium">${startedAt}</p>
          </div>
          <div class="bg-gray-50 p-3 rounded-lg">
            <p class="text-gray-500 mb-1">Completed</p>
            <p class="font-medium">${completedAt}</p>
          </div>
        </div>
      </div>
    `;
  }
};

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
  TaskMaster.init();
}); 