# Task Master Features in the UI

Claude Task Master is now fully integrated into the Cursor DevDock UI, bringing advanced task management capabilities to your development workflow.

## Available Features

### Task Management

- **Create Tasks**: Create new tasks with title, prompt, context, priority, and dependencies
- **View Tasks**: See a list of all tasks with their status, priority, and dependencies
- **Task Details**: View detailed information about each task, including its prompt, context, and response
- **Task Status**: Track the status of tasks (pending, in_progress, completed, failed)
- **Task Dependencies**: Define dependencies between tasks to ensure proper sequencing

### Subtasks

- **Generate Subtasks**: Break down complex tasks into smaller, manageable subtasks
- **Clear Subtasks**: Remove subtasks from a task when needed
- **Subtask Status**: Track the completion status of individual subtasks

### Complexity Analysis

- **Analyze Complexity**: Evaluate the complexity of tasks to identify those that need to be broken down
- **Complexity Metrics**: View complexity scores (1-10) for each task
- **Breakdown Recommendations**: Get recommendations for the number of subtasks based on complexity

### Task Prioritization

- **Priority Levels**: Assign tasks one of four priority levels (low, normal, high, urgent)
- **Next Task Finder**: Automatically identify the highest priority task with all dependencies satisfied

## Using the Task Master UI

### Creating a New Task

1. Click the "New Task" button in the Task Master dashboard
2. Fill in the task details:
   - Title: A descriptive name for the task
   - Prompt: The main request or description for the task
   - Model: Select the Claude model to use
   - Priority: Choose a priority level
   - Dependencies: Enter comma-separated task IDs for dependencies (optional)
3. Click "Submit Task" to create the task

### Managing Tasks

- Click on any task in the list to view its details
- Use the status badges to track progress
- View dependencies to understand task relationships

### Working with Subtasks

- Click "Generate Subtasks" to break down a task
- Each subtask can be tracked independently
- When a parent task is marked as completed, all subtasks are automatically completed

### Using Complexity Analysis

1. Click the "Analyze Complexity" button
2. Review the complexity scores for each task
3. Identify tasks that need to be broken down (usually those with complexity > 5)
4. Use the "Generate Subtasks" button to break down complex tasks

## Best Practices

1. **Define Dependencies Clearly**: Ensure tasks have proper dependencies to maintain workflow
2. **Break Down Complex Tasks**: Use subtasks for any task with complexity over 5
3. **Use the Next Task Finder**: Let the system identify the next task to work on based on dependencies and priorities
4. **Update Status Regularly**: Keep task statuses updated to maintain accurate workflow

## Integration with Cursor

The Claude Task Master UI integrates seamlessly with the Cursor editor, allowing you to:

1. View task details while working on them
2. Update task status directly from the UI
3. Generate subtasks for complex implementation work
4. Track dependencies between different parts of your code

## Additional Resources

For more information on the Claude Task Master, see these documentation pages:

- [Task Master Overview](/docs/task-master-overview)
- [Task Master Commands](/docs/task-master-commands)
- [Task Master Best Practices](/docs/task-master-best-practices) 