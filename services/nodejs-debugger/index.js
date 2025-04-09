const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const temp = require('temp');
const fs = require('fs');
const { spawn } = require('child_process');

// Initialize automatic cleanup for temp files
temp.track();

const app = express();
const port = process.env.PORT || 8005;
const debugPort = process.env.DEBUG_PORT || 9229;

// MCP REST API URL
const MCP_REST_API = process.env.MCP_REST_API || 'http://mcp-rest-api:8001';

// Debug session state
let debugSession = {
  connected: false,
  breakpoints: [],
  consoleOutput: [],
  variables: {},
  currentLocation: null
};

// Store debugging sessions
const debugSessions = {};
let currentSession = null;

// Register with MCP REST API
const registerWithMcpRestApi = async () => {
  try {
    const mcpRestApiHost = process.env.MCP_REST_API_HOST || 'mcp-rest-api';
    const mcpRestApiPort = process.env.MCP_REST_API_PORT || 8001;
    const mcpRestApiUrl = `http://${mcpRestApiHost}:${mcpRestApiPort}`;
    
    await axios.post(`${mcpRestApiUrl}/services`, {
      name: 'nodejs-debugger',
      url: `http://nodejs-debugger:${port}`,
      description: 'Node.js Debugger Service',
      status: 'online'
    });
    
    console.log(`Registered with MCP REST API at ${mcpRestApiUrl}`);
  } catch (error) {
    console.error('Failed to register with MCP REST API:', error.message);
    // Retry after 5 seconds
    setTimeout(registerWithMcpRestApi, 5000);
  }
};

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));

// Create HTTP server
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Send initial debug state
  ws.send(JSON.stringify({
    type: 'debugState',
    data: debugSession
  }));
  
  // Handle WebSocket messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received WebSocket message:', data);
      
      // Handle different message types
      if (data.type === 'command') {
        handleDebugCommand(data.command, data.params);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Handle debug commands
function handleDebugCommand(command, params) {
  console.log(`Executing debug command: ${command}`, params);
  
  // Broadcast debug state update to all clients
  broadcastDebugState();
}

// Broadcast debug state to all connected WebSocket clients
function broadcastDebugState() {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'debugState',
        data: debugSession
      }));
    }
  });
}

// API Endpoints

// Connect to a Node.js process
app.post('/debug/connect', (req, res) => {
  const { port } = req.body;
  
  debugSession.connected = true;
  debugSession.consoleOutput = [];
  debugSession.breakpoints = [];
  debugSession.variables = {};
  
  console.log(`Connected to Node.js process on port ${port || debugPort}`);
  
  // Broadcast updated state
  broadcastDebugState();
  
  res.status(200).json({ success: true, message: 'Connected to debug session' });
});

// Set breakpoint
app.post('/debug/breakpoints', (req, res) => {
  const { file, line } = req.body;
  
  if (!file || !line) {
    return res.status(400).json({ success: false, message: 'File and line are required' });
  }
  
  const breakpointId = `${file}:${line}`;
  debugSession.breakpoints.push({ id: breakpointId, file, line });
  
  console.log(`Set breakpoint at ${file}:${line}`);
  
  // Broadcast updated state
  broadcastDebugState();
  
  res.status(200).json({ 
    success: true, 
    message: 'Breakpoint set', 
    breakpointId 
  });
});

// Evaluate JavaScript code
app.post('/debug/evaluate', (req, res) => {
  const { expression } = req.body;
  
  if (!expression) {
    return res.status(400).json({ success: false, message: 'Expression is required' });
  }
  
  console.log(`Evaluating expression: ${expression}`);
  
  // In a real implementation, this would communicate with the debug protocol
  // For now, we'll just simulate a response
  const result = `Result of ${expression}`;
  
  // Add to console output
  debugSession.consoleOutput.push({
    type: 'evaluation',
    expression,
    result,
    timestamp: new Date().toISOString()
  });
  
  // Broadcast updated state
  broadcastDebugState();
  
  res.status(200).json({ 
    success: true, 
    result 
  });
});

// Get debug state
app.get('/debug/state', (req, res) => {
  res.status(200).json(debugSession);
});

// Start server
server.listen(port, () => {
  console.log(`Node.js Debugger Service listening on port ${port}`);
  console.log(`Debug port available on ${debugPort}`);
  
  // Register with MCP REST API
  registerWithMcpRestApi();
});

// API Endpoints
app.post('/api/debug/start', async (req, res) => {
  try {
    const { code, filename = 'debug-script.js' } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }
    
    // Create temporary file with code
    const tempFile = await new Promise((resolve, reject) => {
      temp.open({ prefix: 'debug-', suffix: '.js' }, (err, info) => {
        if (err) return reject(err);
        fs.writeFile(info.fd, code, (err) => {
          if (err) return reject(err);
          fs.close(info.fd, (err) => {
            if (err) return reject(err);
            resolve(info.path);
          });
        });
      });
    });
    
    // Kill any existing debugging session
    if (currentSession && debugSessions[currentSession]) {
      debugSessions[currentSession].process.kill();
      delete debugSessions[currentSession];
    }
    
    // Start Node.js with debugger
    const sessionId = Date.now().toString();
    const nodeProcess = spawn('node', ['--inspect-brk=' + debugPort, tempFile]);
    
    let output = '';
    
    nodeProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`[Debug Session ${sessionId}] stdout: ${data}`);
    });
    
    nodeProcess.stderr.on('data', (data) => {
      output += data.toString();
      console.log(`[Debug Session ${sessionId}] stderr: ${data}`);
    });
    
    nodeProcess.on('close', (code) => {
      console.log(`[Debug Session ${sessionId}] Process exited with code ${code}`);
      if (debugSessions[sessionId]) {
        debugSessions[sessionId].status = 'closed';
        debugSessions[sessionId].exitCode = code;
      }
    });
    
    debugSessions[sessionId] = {
      process: nodeProcess,
      file: tempFile,
      status: 'running',
      output: '',
      variables: {},
      breakpoints: []
    };
    
    currentSession = sessionId;
    
    res.json({
      sessionId,
      debugUrl: `ws://localhost:${debugPort}`,
      status: 'started'
    });
    
  } catch (error) {
    console.error('Debug start error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/debug/sessions', (req, res) => {
  const sessions = Object.keys(debugSessions).map(id => ({
    id,
    status: debugSessions[id].status,
    breakpoints: debugSessions[id].breakpoints
  }));
  
  res.json({ sessions, currentSession });
});

app.get('/api/debug/session/:id', (req, res) => {
  const { id } = req.params;
  const session = debugSessions[id];
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    id,
    status: session.status,
    output: session.output,
    variables: session.variables,
    breakpoints: session.breakpoints
  });
});

app.post('/api/debug/execute', (req, res) => {
  const { sessionId, command } = req.body;
  
  if (!sessionId || !command) {
    return res.status(400).json({ error: 'Session ID and command are required' });
  }
  
  const session = debugSessions[sessionId];
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Here you would interact with the Chrome DevTools Protocol
  // This is a simplified mock implementation
  let result = null;
  
  try {
    // Mock execution
    result = { value: `Executed: ${command}`, type: 'string' };
    
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/debug/breakpoint', (req, res) => {
  const { sessionId, line, file, action } = req.body;
  
  if (!sessionId || !line || !file) {
    return res.status(400).json({ error: 'Session ID, line number, and file are required' });
  }
  
  const session = debugSessions[sessionId];
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  if (action === 'add') {
    const breakpointId = `${file}:${line}`;
    session.breakpoints.push({ id: breakpointId, file, line });
    res.json({ id: breakpointId, status: 'added' });
  } else if (action === 'remove') {
    const breakpointId = `${file}:${line}`;
    session.breakpoints = session.breakpoints.filter(bp => bp.id !== breakpointId);
    res.json({ id: breakpointId, status: 'removed' });
  } else {
    res.status(400).json({ error: 'Invalid action. Use "add" or "remove"' });
  }
});

app.post('/api/debug/step', (req, res) => {
  const { sessionId, action } = req.body;
  
  if (!sessionId || !action) {
    return res.status(400).json({ error: 'Session ID and action are required' });
  }
  
  const session = debugSessions[sessionId];
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Mock stepping - in a real implementation, you would interact with the debugger
  let result = null;
  
  switch (action) {
    case 'continue':
      result = { status: 'continued' };
      break;
    case 'step_over':
      result = { status: 'stepped over' };
      break;
    case 'step_into':
      result = { status: 'stepped into' };
      break;
    case 'step_out':
      result = { status: 'stepped out' };
      break;
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
  
  res.json(result);
});

app.post('/api/debug/stop', (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }
  
  const session = debugSessions[sessionId];
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  try {
    session.process.kill();
    session.status = 'stopped';
    
    if (currentSession === sessionId) {
      currentSession = null;
    }
    
    res.json({ status: 'stopped' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a simple index.html if it doesn't exist
const publicDir = path.join(__dirname, 'public');
const indexHtml = path.join(publicDir, 'index.html');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (!fs.existsSync(indexHtml)) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Node.js Debugger</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    h1 {
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .editor-container {
      display: flex;
      margin-top: 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }
    .code-editor {
      flex: 3;
      min-height: 400px;
      border-right: 1px solid #ddd;
    }
    .debug-panel {
      flex: 2;
      padding: 10px;
      background: #f9f9f9;
    }
    textarea {
      width: 100%;
      height: 100%;
      border: none;
      padding: 10px;
      font-family: monospace;
      resize: none;
    }
    .controls {
      display: flex;
      margin-top: 10px;
      gap: 10px;
    }
    button {
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background: #0069d9;
    }
    button:disabled {
      background: #cccccc;
    }
    .output {
      margin-top: 20px;
      padding: 10px;
      background: #f1f1f1;
      border-radius: 4px;
      font-family: monospace;
      white-space: pre-wrap;
      max-height: 200px;
      overflow-y: auto;
    }
    .variables {
      margin-top: 10px;
    }
    .variable-item {
      display: flex;
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }
    .variable-name {
      font-weight: bold;
      width: 100px;
    }
    .debug-button {
      background: #6c757d;
      margin-right: 5px;
    }
    .debug-button:hover {
      background: #5a6268;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Node.js Debugger</h1>
    <div class="editor-container">
      <div class="code-editor">
        <textarea id="code-input" placeholder="Enter your JavaScript code here...">console.log('Hello, debugger!');

function add(a, b) {
  return a + b;
}

const result = add(2, 3);
console.log('Result:', result);

for(let i = 0; i < 5; i++) {
  console.log('Iteration', i);</textarea>
      </div>
      <div class="debug-panel">
        <h3>Debugger Controls</h3>
        <div class="controls">
          <button id="start-debug">Start Debugging</button>
          <button id="stop-debug" disabled>Stop</button>
        </div>
        <div class="controls">
          <button id="continue" class="debug-button" disabled>Continue</button>
          <button id="step-over" class="debug-button" disabled>Step Over</button>
          <button id="step-into" class="debug-button" disabled>Step Into</button>
          <button id="step-out" class="debug-button" disabled>Step Out</button>
        </div>
        <h3>Variables</h3>
        <div id="variables" class="variables">
          <div class="variable-item">
            <span class="variable-name">-</span>
            <span class="variable-value">-</span>
          </div>
        </div>
        <h3>Output</h3>
        <div id="output" class="output">Debugging output will appear here...</div>
      </div>
    </div>
  </div>
  
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Get elements
      const codeInput = document.getElementById('code-input');
      const startDebugBtn = document.getElementById('start-debug');
      const stopDebugBtn = document.getElementById('stop-debug');
      const continueBtn = document.getElementById('continue');
      const stepOverBtn = document.getElementById('step-over');
      const stepIntoBtn = document.getElementById('step-into');
      const stepOutBtn = document.getElementById('step-out');
      const outputEl = document.getElementById('output');
      const variablesEl = document.getElementById('variables');
      
      let currentSession = null;
      
      // Start debugging
      startDebugBtn.addEventListener('click', async () => {
        try {
          outputEl.textContent = 'Starting debugger...';
          
          const response = await fetch('/api/debug/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              code: codeInput.value
            })
          });
          
          const data = await response.json();
          
          if (data.error) {
            outputEl.textContent = 'Error: ' + data.error;
            return;
          }
          
          currentSession = data.sessionId;
          outputEl.textContent = 'Debugger started. Session ID: ' + currentSession;
          
          // Enable debugging controls
          stopDebugBtn.disabled = false;
          continueBtn.disabled = false;
          stepOverBtn.disabled = false;
          stepIntoBtn.disabled = false;
          stepOutBtn.disabled = false;
          startDebugBtn.disabled = true;
          
        } catch (error) {
          outputEl.textContent = 'Error: ' + error.message;
        }
      });
      
      // Stop debugging
      stopDebugBtn.addEventListener('click', async () => {
        if (!currentSession) return;
        
        try {
          const response = await fetch('/api/debug/stop', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sessionId: currentSession
            })
          });
          
          const data = await response.json();
          
          if (data.error) {
            outputEl.textContent = 'Error: ' + data.error;
            return;
          }
          
          outputEl.textContent = 'Debugging session stopped.';
          
          // Disable debugging controls
          stopDebugBtn.disabled = true;
          continueBtn.disabled = true;
          stepOverBtn.disabled = true;
          stepIntoBtn.disabled = true;
          stepOutBtn.disabled = true;
          startDebugBtn.disabled = false;
          
          currentSession = null;
          
        } catch (error) {
          outputEl.textContent = 'Error: ' + error.message;
        }
      });
      
      // Debug step functions
      const debugStep = async (action) => {
        if (!currentSession) return;
        
        try {
          const response = await fetch('/api/debug/step', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sessionId: currentSession,
              action: action
            })
          });
          
          const data = await response.json();
          
          if (data.error) {
            outputEl.textContent = 'Error: ' + data.error;
            return;
          }
          
          outputEl.textContent = 'Debug action: ' + action + '\nStatus: ' + data.status;
          
          // Mock update of variables (in a real implementation, this would come from the debugger)
          updateVariables({
            'result': { value: 5, type: 'number' },
            'i': { value: 2, type: 'number' }
          });
          
        } catch (error) {
          outputEl.textContent = 'Error: ' + error.message;
        }
      };
      
      continueBtn.addEventListener('click', () => debugStep('continue'));
      stepOverBtn.addEventListener('click', () => debugStep('step_over'));
      stepIntoBtn.addEventListener('click', () => debugStep('step_into'));
      stepOutBtn.addEventListener('click', () => debugStep('step_out'));
      
      // Update variables display
      function updateVariables(vars) {
        variablesEl.innerHTML = '';
        
        if (!vars || Object.keys(vars).length === 0) {
          const item = document.createElement('div');
          item.className = 'variable-item';
          item.innerHTML = '<span class="variable-name">-</span><span class="variable-value">-</span>';
          variablesEl.appendChild(item);
          return;
        }
        
        for (const [name, info] of Object.entries(vars)) {
          const item = document.createElement('div');
          item.className = 'variable-item';
          
          const nameSpan = document.createElement('span');
          nameSpan.className = 'variable-name';
          nameSpan.textContent = name;
          
          const valueSpan = document.createElement('span');
          valueSpan.className = 'variable-value';
          valueSpan.textContent = info.value + ' (' + info.type + ')';
          
          item.appendChild(nameSpan);
          item.appendChild(valueSpan);
          variablesEl.appendChild(item);
        }
      }
    });
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync(indexHtml, html);
} 