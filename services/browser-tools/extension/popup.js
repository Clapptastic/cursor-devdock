/**
 * DevDock Browser Monitor Extension
 * Popup UI script
 */

// UI Elements
const statusContainer = document.getElementById('status-container');
const statusText = document.getElementById('status-text');
const serverUrlInput = document.getElementById('server-url');
const autoConnectCheckbox = document.getElementById('auto-connect');
const logLevelSelect = document.getElementById('log-level');
const connectBtn = document.getElementById('connect-btn');
const saveBtn = document.getElementById('save-btn');
const clearLogsBtn = document.getElementById('clear-logs-btn');

// Initialize popup
async function initializePopup() {
  // Load the current config
  try {
    const stored = await chrome.storage.local.get(['devdockConfig', 'devdockConnectionStatus']);
    
    if (stored.devdockConfig) {
      serverUrlInput.value = stored.devdockConfig.serverUrl || 'http://localhost:8004';
      autoConnectCheckbox.checked = stored.devdockConfig.autoConnect !== false;
      
      if (stored.devdockConfig.logLevel && logLevelSelect.querySelector(`option[value="${stored.devdockConfig.logLevel}"]`)) {
        logLevelSelect.value = stored.devdockConfig.logLevel;
      }
    } else {
      serverUrlInput.value = 'http://localhost:8004';
    }
    
    // Update the connection status
    updateConnectionStatus(stored.devdockConnectionStatus);
    
    // Also check the current status from the background script
    chrome.runtime.sendMessage({ action: 'checkConnection' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error checking connection:', chrome.runtime.lastError);
        return;
      }
      
      updateConnectionStatus(response);
    });
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
}

// Update the connection status UI
function updateConnectionStatus(status) {
  if (status && status.connected) {
    statusContainer.classList.remove('disconnected');
    statusContainer.classList.add('connected');
    statusContainer.querySelector('.status-indicator').classList.remove('disconnected');
    statusContainer.querySelector('.status-indicator').classList.add('connected');
    statusText.textContent = 'Connected';
    connectBtn.textContent = 'Reconnect';
  } else {
    statusContainer.classList.remove('connected');
    statusContainer.classList.add('disconnected');
    statusContainer.querySelector('.status-indicator').classList.remove('connected');
    statusContainer.querySelector('.status-indicator').classList.add('disconnected');
    statusText.textContent = 'Disconnected';
    connectBtn.textContent = 'Connect';
  }
}

// Save the configuration
async function saveConfig() {
  try {
    const config = {
      serverUrl: serverUrlInput.value.trim() || 'http://localhost:8004',
      autoConnect: autoConnectCheckbox.checked,
      logLevel: logLevelSelect.value
    };
    
    await chrome.storage.local.set({ devdockConfig: config });
    
    // Send the updated config to the background script
    chrome.runtime.sendMessage({
      action: 'updateConfig',
      config: config
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error updating config:', chrome.runtime.lastError);
        return;
      }
      
      if (response && response.success) {
        // Show a brief success message
        saveBtn.textContent = 'Saved!';
        setTimeout(() => {
          saveBtn.textContent = 'Save Settings';
        }, 1500);
      }
    });
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

// Connect to the server
function connectToServer() {
  // Save the current server URL first
  const serverUrl = serverUrlInput.value.trim() || 'http://localhost:8004';
  
  chrome.runtime.sendMessage({
    action: 'updateConfig',
    config: { serverUrl }
  }, () => {
    // Then attempt to connect
    chrome.runtime.sendMessage({ action: 'connect' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error connecting to server:', chrome.runtime.lastError);
        return;
      }
      
      updateConnectionStatus(response);
    });
  });
}

// Clear all logs
function clearLogs() {
  chrome.runtime.sendMessage({ action: 'clearLogs' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error clearing logs:', chrome.runtime.lastError);
      return;
    }
    
    if (response && response.success) {
      // Show a brief success message
      clearLogsBtn.textContent = 'Logs Cleared!';
      setTimeout(() => {
        clearLogsBtn.textContent = 'Clear All Logs';
      }, 1500);
    }
  });
}

// Event listeners
connectBtn.addEventListener('click', connectToServer);
saveBtn.addEventListener('click', saveConfig);
clearLogsBtn.addEventListener('click', clearLogs);

// Initialize the popup when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup); 