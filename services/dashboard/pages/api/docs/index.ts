import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DOCS_DIR = path.join(process.cwd(), 'docs');

// Function to ensure the docs directory exists
const ensureDocsDir = () => {
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }
};

// Function to populate initial docs if directory is empty
const populateInitialDocs = () => {
  const initialDocs = [
    {
      id: 'task-master-overview',
      title: 'Task Master Overview',
      content: `# Claude Task Master Overview

Claude Task Master is an AI-powered task-management system designed to integrate with Cursor. 
It helps developers manage complex projects by breaking them down into manageable tasks and subtasks.

## Key Features

* Create tasks with AI-assistance
* Break down complex tasks into subtasks
* Track task dependencies
* Analyze task complexity
* Prioritize tasks intelligently
* Generate detailed implementation plans

Check out the other documentation pages for more details on specific features and commands.`
    },
    {
      id: 'task-master-commands',
      title: 'Task Master Commands',
      content: `# Task Master Commands

## Basic Commands

### List Tasks
\`\`\`
# List all tasks
task-master list

# List tasks with subtasks
task-master list --with-subtasks

# List tasks with a specific status and include subtasks
task-master list --status=<status> --with-subtasks
\`\`\`

### Show Next Task
\`\`\`
# Show the next task to work on based on dependencies and status
task-master next
\`\`\`

### Show Specific Task
\`\`\`
# Show details of a specific task
task-master show <id>
# or
task-master show --id=<id>

# View a specific subtask (e.g., subtask 2 of task 1)
task-master show 1.2
\`\`\`

### Update Tasks
\`\`\`
# Update tasks from a specific ID and provide context
task-master update --from=<id> --prompt="<prompt>"
\`\`\`

### Generate Task Files
\`\`\`
# Generate individual task files from tasks.json
task-master generate
\`\`\`

### Set Task Status
\`\`\`
# Set status of a single task
task-master set-status --id=<id> --status=<status>

# Set status for multiple tasks
task-master set-status --id=1,2,3 --status=<status>

# Set status for subtasks
task-master set-status --id=1.1,1.2 --status=<status>
\`\`\`

When marking a task as "done", all of its subtasks will automatically be marked as "done" as well.

### Expand Tasks
\`\`\`
# Expand a specific task with subtasks
task-master expand --id=<id> --num=<number>

# Expand with additional context
task-master expand --id=<id> --prompt="<context>"

# Expand all pending tasks
task-master expand --all

# Force regeneration of subtasks for tasks that already have them
task-master expand --all --force

# Research-backed subtask generation for a specific task
task-master expand --id=<id> --research

# Research-backed generation for all tasks
task-master expand --all --research
\`\`\`

### Clear Subtasks
\`\`\`
# Clear subtasks from a specific task
task-master clear-subtasks --id=<id>

# Clear subtasks from multiple tasks
task-master clear-subtasks --id=1,2,3

# Clear subtasks from all tasks
task-master clear-subtasks --all
\`\`\`

### Analyze Task Complexity
\`\`\`
# Analyze complexity of all tasks
task-master analyze-complexity

# Save report to a custom location
task-master analyze-complexity --output=my-report.json

# Use a specific LLM model
task-master analyze-complexity --model=claude-3-opus-20240229

# Set a custom complexity threshold (1-10)
task-master analyze-complexity --threshold=6

# Use an alternative tasks file
task-master analyze-complexity --file=custom-tasks.json

# Use Perplexity AI for research-backed complexity analysis
task-master analyze-complexity --research
\`\`\`

### View Complexity Report
\`\`\`
# Display the task complexity analysis report
task-master complexity-report

# View a report at a custom location
task-master complexity-report --file=my-report.json
\`\`\`

### Managing Task Dependencies
\`\`\`
# Add a dependency to a task
task-master add-dependency --id=<id> --depends-on=<id>

# Remove a dependency from a task
task-master remove-dependency --id=<id> --depends-on=<id>

# Validate dependencies without fixing them
task-master validate-dependencies

# Find and fix invalid dependencies automatically
task-master fix-dependencies
\`\`\`

### Add a New Task
\`\`\`
# Add a new task using AI
task-master add-task --prompt="Description of the new task"

# Add a task with dependencies
task-master add-task --prompt="Description" --dependencies=1,2,3

# Add a task with priority
task-master add-task --prompt="Description" --priority=high
\`\`\``
    },
    {
      id: 'task-master-best-practices',
      title: 'Task Master Best Practices',
      content: `# Best Practices for AI-Driven Development

1. **Start with a detailed PRD**: The more detailed your PRD, the better the generated tasks will be.
2. **Review generated tasks**: After parsing the PRD, review the tasks to ensure they make sense and have appropriate dependencies.
3. **Analyze task complexity**: Use the complexity analysis feature to identify which tasks should be broken down further.
4. **Follow the dependency chain**: Always respect task dependencies - the Cursor agent will help with this.
5. **Update as you go**: If your implementation diverges from the plan, use the update command to keep future tasks aligned with your current approach.
6. **Break down complex tasks**: Use the expand command to break down complex tasks into manageable subtasks.
7. **Regenerate task files**: After any updates to tasks.json, regenerate the task files to keep them in sync.
8. **Communicate context to the agent**: When asking the Cursor agent to help with a task, provide context about what you're trying to achieve.
9. **Validate dependencies**: Periodically run the validate-dependencies command to check for invalid or circular dependencies.

## Example Cursor AI Interactions

### Starting a new project

\`\`\`
I've just initialized a new project with Claude Task Master. I have a PRD at scripts/prd.txt.
Can you help me parse it and set up the initial tasks?
\`\`\`

### Working on tasks

\`\`\`
What's the next task I should work on? Please consider dependencies and priorities.
\`\`\`

### Implementing a specific task

\`\`\`
I'd like to implement task 4. Can you help me understand what needs to be done and how to approach it?
\`\`\`

### Managing subtasks

\`\`\`
I need to regenerate the subtasks for task 3 with a different approach. Can you help me clear and regenerate them?
\`\`\`

### Handling changes

\`\`\`
We've decided to use MongoDB instead of PostgreSQL. Can you update all future tasks to reflect this change?
\`\`\`

### Completing work

\`\`\`
I've finished implementing the authentication system described in task 2. All tests are passing.
Please mark it as complete and tell me what I should work on next.
\`\`\`

### Analyzing complexity

\`\`\`
Can you analyze the complexity of our tasks to help me understand which ones need to be broken down further?
\`\`\`

### Viewing complexity report

\`\`\`
Can you show me the complexity report in a more readable format?
\`\`\``
    }
  ];

  // If no docs exist yet, create initial ones
  const files = fs.readdirSync(DOCS_DIR);
  if (files.length === 0) {
    initialDocs.forEach(doc => {
      fs.writeFileSync(path.join(DOCS_DIR, `${doc.id}.md`), doc.content);
    });
  }
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Ensure the docs directory exists
    ensureDocsDir();
    
    // Populate with initial docs if needed
    populateInitialDocs();
    
    // Get all markdown files in the docs directory
    const files = fs.readdirSync(DOCS_DIR)
      .filter(file => file.endsWith('.md'));
    
    // Create document list with metadata
    const documents = files.map(file => {
      const id = file.replace('.md', '');
      // Read the first line to extract title
      const content = fs.readFileSync(path.join(DOCS_DIR, file), 'utf8');
      const titleMatch = content.match(/^# (.*?)$/m);
      const title = titleMatch ? titleMatch[1] : id; // Use ID as fallback title
      
      return {
        id,
        title,
        path: `/docs/${id}`
      };
    });
    
    res.status(200).json(documents);
  } catch (error) {
    console.error('Error handling docs request:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
} 