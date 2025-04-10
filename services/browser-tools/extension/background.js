/**
 * DevDock Browser Monitor Extension
 * Background script for handling communication with DevDock Browser Tools
 */

// Configuration
const DEFAULT_CONFIG = {
  serverUrl: 'http://localhost:8004', // Default URL for the browser-tools service
  autoConnect: true,
  logLevel: 'info'
};

// State
let config = { ...DEFAULT_CONFIG };
let connectionStatus = {
  connected: false,
  lastChecked: null,
  lastError: null
};

// Initialize extension
async function initialize() {
  console.log('DevDock Browser Monitor: Initializing');
  
  // Load config from storage
  try {
    const stored = await chrome.storage.local.get('devdockConfig');
    if (stored.devdockConfig) {
      config = { ...DEFAULT_CONFIG, ...stored.devdockConfig };
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  
  // Attempt to connect to the server
  if (config.autoConnect) {
    connectToServer();
  }
  
  // Set up periodic connection check
  setInterval(checkServerConnection, 30000);
}

// Connect to the DevDock server
async function connectToServer() {
  try {
    const response = await fetch(`${config.serverUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      connectionStatus = {
        connected: true,
        lastChecked: new Date().toISOString(),
        lastError: null
      };
      console.log('DevDock Browser Monitor: Connected to server', data);
      
      // Store connection status
      chrome.storage.local.set({ 'devdockConnectionStatus': connectionStatus });
      
      // Update badge to show connected status
      chrome.action.setBadgeText({ text: 'ON' });
      chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
      
      return true;
    } else {
      throw new Error(`Server returned status ${response.status}`);
    }
  } catch (error) {
    connectionStatus = {
      connected: false,
      lastChecked: new Date().toISOString(),
      lastError: error.message
    };
    console.error('DevDock Browser Monitor: Connection failed', error);
    
    // Store connection status
    chrome.storage.local.set({ 'devdockConnectionStatus': connectionStatus });
    
    // Update badge to show disconnected status
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
    
    return false;
  }
}

// Check if the server is still reachable
async function checkServerConnection() {
  if (config.autoConnect) {
    await connectToServer();
  }
}

// Handle messages from content scripts or external applications
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('DevDock Browser Monitor: Received message', message);
  
  // Handle connection check request
  if (message.action === 'checkConnection') {
    sendResponse({
      connected: connectionStatus.connected,
      lastChecked: connectionStatus.lastChecked,
      serverUrl: config.serverUrl
    });
    return true;
  }
  
  // Handle log data from content scripts
  if (message.action === 'sendLog' && message.data) {
    sendLogToServer(message.data)
      .then(result => sendResponse({ success: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  // Handle config update
  if (message.action === 'updateConfig' && message.config) {
    updateConfig(message.config)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  // Handle manual connection attempt
  if (message.action === 'connect') {
    connectToServer()
      .then(result => sendResponse({ success: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  return false;
});

// Send log data to the DevDock server
async function sendLogToServer(logData) {
  if (!connectionStatus.connected) {
    console.warn('DevDock Browser Monitor: Not connected to server, cannot send log');
    return false;
  }
  
  try {
    // Determine the API endpoint based on log type
    let endpoint = '/api/logs/browser';
    if (logData.type === 'error') {
      endpoint = '/api/logs/console-error';
    } else if (logData.type === 'network-error') {
      endpoint = '/api/logs/network-error';
    } else if (logData.type === 'network') {
      endpoint = '/api/logs/network';
    }
    
    // Send the log to the server
    const response = await fetch(`${config.serverUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logData)
    });
    
    if (response.ok) {
      return true;
    } else {
      throw new Error(`Server returned status ${response.status}`);
    }
  } catch (error) {
    console.error('DevDock Browser Monitor: Error sending log', error);
    return false;
  }
}

// Update the extension configuration
async function updateConfig(newConfig) {
  config = { ...config, ...newConfig };
  
  // Store the updated config
  await chrome.storage.local.set({ 'devdockConfig': config });
  
  // If autoConnect is enabled, attempt to connect
  if (config.autoConnect) {
    await connectToServer();
  }
  
  return true;
}

// Initialize the extension
initialize(); 