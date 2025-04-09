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
const Inspector = require('inspector');

// Initialize automatic cleanup for temp files
temp.track();

const app = express();
const port = process.env.PORT || 3456;
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

// Helper function to connect to Node.js debugger
async function connectToDebugger(port = 9229) {
  try {
    if (debugSession) {
      await disconnectDebugger();
    }
    
    debugSession = new Inspector.Session();
    await debugSession.connect(`localhost:${port}`);
    
    // Enable required domains
    await debugSession.post('Debugger.enable');
    await debugSession.post('Runtime.enable');
    await debugSession.post('Console.enable');
    
    // Set up event listeners
    debugSession.on('Debugger.paused', handleDebuggerPaused);
    debugSession.on('Debugger.resumed', handleDebuggerResumed);
    debugSession.on('Console.messageAdded', handleConsoleMessage);
    
    debugSession.connected = true;
    broadcastToClients({ type: 'connection', status: 'connected', port });
    console.log(`Connected to Node.js debugger on port ${port}`);
    return true;
  } catch (error) {
    console.error('Failed to connect to debugger:', error.message);
    debugSession.connected = false;
    broadcastToClients({ type: 'connection', status: 'error', error: error.message });
    return false;
  }
}

// Disconnect from debugger
async function disconnectDebugger() {
  if (debugSession) {
    try {
      await debugSession.disconnect();
      debugSession = null;
      debugSession.connected = false;
      broadcastToClients({ type: 'connection', status: 'disconnected' });
      console.log('Disconnected from Node.js debugger');
    } catch (error) {
      console.error('Error disconnecting from debugger:', error.message);
    }
  }
}

// Handle debugger pause events
function handleDebuggerPaused(params) {
  const { callFrames, reason } = params;
  const pauseInfo = {
    type: 'paused',
    reason,
    location: callFrames[0]?.location,
    callFrames: callFrames.map(frame => ({
      functionName: frame.functionName,
      location: frame.location,
      url: frame.url,
    })),
  };
  
  broadcastToClients(pauseInfo);
  console.log(`Debugger paused: ${reason}`);
}

// Handle debugger resume events
function handleDebuggerResumed() {
  broadcastToClients({ type: 'resumed' });
  console.log('Debugger resumed execution');
}

// Handle console messages
function handleConsoleMessage(params) {
  const { message } = params;
  const consoleMsg = {
    type: message.type,
    text: message.text,
    timestamp: new Date().toISOString(),
  };
  
  debugSession.consoleOutput.push(consoleMsg);
  if (debugSession.consoleOutput.length > 100) {
    debugSession.consoleOutput.shift(); // Keep last 100 messages
  }
  
  broadcastToClients({ type: 'console', message: consoleMsg });
}

// Broadcast message to all connected WebSocket clients
function broadcastToClients(message) {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Create temporary file for debugging
function createTempFile(content) {
  return new Promise((resolve, reject) => {
    temp.open('debug-script', (err, info) => {
      if (err) return reject(err);
      
      fs.write(info.fd, content, err => {
        if (err) return reject(err);
        
        fs.close(info.fd, err => {
          if (err) return reject(err);
          resolve(info.path);
        });
      });
    });
  });
}

// Run a JavaScript file with debugging enabled
async function runWithDebugger(filePath, args = []) {
  if (debugSession.process) {
    debugSession.process.kill();
    debugSession.process = null;
  }
  
  return new Promise((resolve, reject) => {
    const options = ['--inspect=0.0.0.0:9229', filePath, ...args];
    debugSession.process = spawn('node', options);
    
    debugSession.process.stdout.on('data', data => {
      const output = data.toString();
      debugSession.consoleOutput.push({
        type: 'stdout',
        text: output,
        timestamp: new Date().toISOString(),
      });
      broadcastToClients({ type: 'process-output', source: 'stdout', output });
      console.log(`[Process stdout] ${output}`);
    });
    
    debugSession.process.stderr.on('data', data => {
      const output = data.toString();
      debugSession.consoleOutput.push({
        type: 'stderr',
        text: output,
        timestamp: new Date().toISOString(),
      });
      broadcastToClients({ type: 'process-output', source: 'stderr', output });
      console.error(`[Process stderr] ${output}`);
    });
    
    debugSession.process.on('close', code => {
      broadcastToClients({ type: 'process-exit', code });
      console.log(`Child process exited with code ${code}`);
      debugSession.process = null;
    });
    
    // Wait for the debugger to become available
    const maxRetries = 5;
    let retryCount = 0;
    
    const tryConnect = async () => {
      try {
        if (await connectToDebugger(9229)) {
          resolve(true);
        } else {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Retrying connection in 1 second (attempt ${retryCount}/${maxRetries})...`);
            setTimeout(tryConnect, 1000);
          } else {
            reject(new Error('Failed to connect to debugger after multiple attempts'));
          }
        }
      } catch (error) {
        reject(error);
      }
    };
    
    // Give the process a moment to start
    setTimeout(tryConnect, 1000);
  });
}

//========== API Endpoints ==========//

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', connected: debugSession.connected });
});

// Connect to Node.js debugger
app.post('/api/debugger/connect', async (req, res) => {
  const { port = 9229 } = req.body;
  
  try {
    if (await connectToDebugger(port)) {
      res.json({ success: true, message: `Connected to debugger on port ${port}` });
    } else {
      res.status(500).json({ success: false, message: 'Failed to connect to debugger' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Disconnect from debugger
app.post('/api/debugger/disconnect', async (req, res) => {
  try {
    await disconnectDebugger();
    res.json({ success: true, message: 'Disconnected from debugger' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Execute JavaScript code in the debugged process
app.post('/api/debugger/execute', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ success: false, message: 'Code is required' });
  }
  
  if (!debugSession || !debugSession.connected) {
    return res.status(400).json({ success: false, message: 'Not connected to debugger' });
  }
  
  try {
    const result = await debugSession.post('Runtime.evaluate', {
      expression: code,
      objectGroup: 'console',
      includeCommandLineAPI: true,
      silent: false,
      contextId: 1,
      returnByValue: true,
      generatePreview: true,
      userGesture: true,
      awaitPromise: true,
    });
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Set a breakpoint
app.post('/api/debugger/breakpoints/set', async (req, res) => {
  const { file, line } = req.body;
  
  if (!file || typeof line !== 'number') {
    return res.status(400).json({ success: false, message: 'File path and line number are required' });
  }
  
  if (!debugSession || !debugSession.connected) {
    return res.status(400).json({ success: false, message: 'Not connected to debugger' });
  }
  
  try {
    const result = await debugSession.post('Debugger.setBreakpointByUrl', {
      url: `file://${file}`,
      lineNumber: line,
      columnNumber: 0,
    });
    
    const breakpoint = {
      id: result.breakpointId,
      file,
      line,
      locations: result.locations,
    };
    
    debugSession.breakpoints.push(breakpoint);
    broadcastToClients({ type: 'breakpoint-set', breakpoint });
    
    res.json({ success: true, breakpoint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove a breakpoint
app.post('/api/debugger/breakpoints/remove', async (req, res) => {
  const { breakpointId } = req.body;
  
  if (!breakpointId) {
    return res.status(400).json({ success: false, message: 'Breakpoint ID is required' });
  }
  
  if (!debugSession || !debugSession.connected) {
    return res.status(400).json({ success: false, message: 'Not connected to debugger' });
  }
  
  try {
    await debugSession.post('Debugger.removeBreakpoint', { breakpointId });
    
    // Remove from our list
    debugSession.breakpoints = debugSession.breakpoints.filter(bp => bp.id !== breakpointId);
    broadcastToClients({ type: 'breakpoint-removed', breakpointId });
    
    res.json({ success: true, message: 'Breakpoint removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// List all breakpoints
app.get('/api/debugger/breakpoints', (req, res) => {
  res.json({ success: true, breakpoints: debugSession.breakpoints });
});

// Step over to the next line
app.post('/api/debugger/step-over', async (req, res) => {
  if (!debugSession || !debugSession.connected) {
    return res.status(400).json({ success: false, message: 'Not connected to debugger' });
  }
  
  try {
    await debugSession.post('Debugger.stepOver');
    res.json({ success: true, message: 'Stepped over' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Step into a function
app.post('/api/debugger/step-into', async (req, res) => {
  if (!debugSession || !debugSession.connected) {
    return res.status(400).json({ success: false, message: 'Not connected to debugger' });
  }
  
  try {
    await debugSession.post('Debugger.stepInto');
    res.json({ success: true, message: 'Stepped into' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Step out of the current function
app.post('/api/debugger/step-out', async (req, res) => {
  if (!debugSession || !debugSession.connected) {
    return res.status(400).json({ success: false, message: 'Not connected to debugger' });
  }
  
  try {
    await debugSession.post('Debugger.stepOut');
    res.json({ success: true, message: 'Stepped out' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Continue execution
app.post('/api/debugger/continue', async (req, res) => {
  if (!debugSession || !debugSession.connected) {
    return res.status(400).json({ success: false, message: 'Not connected to debugger' });
  }
  
  try {
    await debugSession.post('Debugger.resume');
    res.json({ success: true, message: 'Execution resumed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get local variables in current scope
app.get('/api/debugger/variables', async (req, res) => {
  const { scope = 'local' } = req.query;
  
  if (!debugSession || !debugSession.connected) {
    return res.status(400).json({ success: false, message: 'Not connected to debugger' });
  }
  
  try {
    // Get call frames to find the scope
    const { result } = await debugSession.post('Debugger.paused');
    if (!result || !result.callFrames || !result.callFrames.length) {
      return res.status(400).json({ success: false, message: 'Debugger is not paused' });
    }
    
    const frame = result.callFrames[0];
    let scopeChain = frame.scopeChain;
    
    // Find the requested scope
    let targetScope;
    if (scope === 'local') {
      targetScope = scopeChain.find(s => s.type === 'local');
    } else if (scope === 'global') {
      targetScope = scopeChain.find(s => s.type === 'global');
    }
    
    if (!targetScope) {
      return res.status(400).json({ success: false, message: `${scope} scope not found` });
    }
    
    // Get properties of the scope object
    const properties = await debugSession.post('Runtime.getProperties', {
      objectId: targetScope.object.objectId,
      ownProperties: true,
      accessorPropertiesOnly: false,
      generatePreview: true,
    });
    
    res.json({ success: true, variables: properties.result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get console output
app.get('/api/debugger/console', (req, res) => {
  const { limit = 20 } = req.query;
  res.json({ success: true, output: debugSession.consoleOutput.slice(-parseInt(limit)) });
});

// Evaluate expression
app.post('/api/debugger/evaluate', async (req, res) => {
  const { expression } = req.body;
  
  if (!expression) {
    return res.status(400).json({ success: false, message: 'Expression is required' });
  }
  
  if (!debugSession || !debugSession.connected) {
    return res.status(400).json({ success: false, message: 'Not connected to debugger' });
  }
  
  try {
    const result = await debugSession.post('Runtime.evaluate', {
      expression,
      objectGroup: 'console',
      includeCommandLineAPI: true,
      silent: false,
      returnByValue: true,
      generatePreview: true,
    });
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current execution location
app.get('/api/debugger/location', async (req, res) => {
  if (!debugSession || !debugSession.connected) {
    return res.status(400).json({ success: false, message: 'Not connected to debugger' });
  }
  
  try {
    // Check if debugger is paused
    const pausedInfo = await debugSession.post('Debugger.paused');
    if (!pausedInfo || !pausedInfo.callFrames || !pausedInfo.callFrames.length) {
      return res.json({ success: true, paused: false });
    }
    
    const frame = pausedInfo.callFrames[0];
    res.json({
      success: true,
      paused: true,
      location: {
        file: frame.url,
        line: frame.location.lineNumber,
        column: frame.location.columnNumber,
        functionName: frame.functionName,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Run code in debug mode
app.post('/api/debugger/run', async (req, res) => {
  const { code, args = [] } = req.body;
  
  if (!code) {
    return res.status(400).json({ success: false, message: 'Code is required' });
  }
  
  try {
    // Create a temporary file with the code
    const filePath = await createTempFile(code);
    
    // Run the file with debugging enabled
    await runWithDebugger(filePath, args);
    
    res.json({ success: true, message: 'Started debugging session' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// WebSocket handling
app.server = app.listen(port, async () => {
  console.log(`Node.js debugger service running on port ${port}`);
  await registerWithMcpRestApi();
});

// Handle WebSocket upgrade
app.server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, ws => {
    wss.emit('connection', ws, request);
  });
});

// WebSocket connection handling
wss.on('connection', ws => {
  console.log('WebSocket client connected');
  
  // Send initial state
  ws.send(JSON.stringify({ 
    type: 'init', 
    connected: debugSession.connected,
    breakpoints: debugSession.breakpoints,
  }));
  
  ws.on('message', message => {
    try {
      const data = JSON.parse(message);
      console.log('Received message from client:', data);
      
      // Process WebSocket commands if needed
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Node.js debugger service...');
  
  if (debugSession.process) {
    debugSession.process.kill();
    debugSession.process = null;
  }
  
  await disconnectDebugger();
  
  if (app.server) {
    app.server.close();
  }
  
  process.exit(0);
}); 