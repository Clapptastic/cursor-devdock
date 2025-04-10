/**
 * DevDock Browser Monitor Extension
 * Content script for capturing logs, errors, and network activity
 */

// Send a message to the background script
function sendToBackground(message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(response);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Get the current page URL
function getCurrentUrl() {
  return window.location.href;
}

// Initialize log interception
function initLogCapture() {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };

  // Override console.log
  console.log = function() {
    const args = Array.from(arguments);
    const message = args.map(arg => {
      try {
        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
      } catch (e) {
        return String(arg);
      }
    }).join(' ');

    sendToBackground({
      action: 'sendLog',
      data: {
        type: 'browser',
        url: getCurrentUrl(),
        event: 'console.log',
        details: { message, level: 'log' },
        timestamp: new Date().toISOString()
      }
    }).catch(error => {
      // Silently fail to avoid loops
    });

    // Call the original method
    return originalConsole.log.apply(console, args);
  };

  // Override console.info
  console.info = function() {
    const args = Array.from(arguments);
    const message = args.map(arg => {
      try {
        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
      } catch (e) {
        return String(arg);
      }
    }).join(' ');

    sendToBackground({
      action: 'sendLog',
      data: {
        type: 'browser',
        url: getCurrentUrl(),
        event: 'console.info',
        details: { message, level: 'info' },
        timestamp: new Date().toISOString()
      }
    }).catch(error => {
      // Silently fail to avoid loops
    });

    // Call the original method
    return originalConsole.info.apply(console, args);
  };

  // Override console.warn
  console.warn = function() {
    const args = Array.from(arguments);
    const message = args.map(arg => {
      try {
        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
      } catch (e) {
        return String(arg);
      }
    }).join(' ');

    sendToBackground({
      action: 'sendLog',
      data: {
        type: 'browser',
        url: getCurrentUrl(),
        event: 'console.warn',
        details: { message, level: 'warn' },
        timestamp: new Date().toISOString()
      }
    }).catch(error => {
      // Silently fail to avoid loops
    });

    // Call the original method
    return originalConsole.warn.apply(console, args);
  };

  // Override console.error
  console.error = function() {
    const args = Array.from(arguments);
    const message = args.map(arg => {
      try {
        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
      } catch (e) {
        return String(arg);
      }
    }).join(' ');

    let stack = '';
    try {
      // Try to capture stack trace
      const error = new Error();
      stack = error.stack || '';
    } catch (e) {
      // Ignore errors capturing stack
    }

    sendToBackground({
      action: 'sendLog',
      data: {
        type: 'error',
        url: getCurrentUrl(),
        message: message,
        stack: stack,
        timestamp: new Date().toISOString()
      }
    }).catch(error => {
      // Silently fail to avoid loops
    });

    // Call the original method
    return originalConsole.error.apply(console, args);
  };

  // Override console.debug
  console.debug = function() {
    const args = Array.from(arguments);
    const message = args.map(arg => {
      try {
        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
      } catch (e) {
        return String(arg);
      }
    }).join(' ');

    sendToBackground({
      action: 'sendLog',
      data: {
        type: 'browser',
        url: getCurrentUrl(),
        event: 'console.debug',
        details: { message, level: 'debug' },
        timestamp: new Date().toISOString()
      }
    }).catch(error => {
      // Silently fail to avoid loops
    });

    // Call the original method
    return originalConsole.debug.apply(console, args);
  };

  // Capture uncaught errors
  window.addEventListener('error', function(event) {
    sendToBackground({
      action: 'sendLog',
      data: {
        type: 'error',
        url: getCurrentUrl(),
        message: event.message || 'Uncaught error',
        stack: event.error ? (event.error.stack || '') : '',
        timestamp: new Date().toISOString()
      }
    }).catch(error => {
      // Silently fail to avoid loops
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    let message = 'Unhandled Promise Rejection';
    let stack = '';

    try {
      if (event.reason) {
        if (typeof event.reason === 'object' && event.reason.message) {
          message = event.reason.message;
        } else {
          message = String(event.reason);
        }
        
        if (event.reason.stack) {
          stack = event.reason.stack;
        }
      }
    } catch (e) {
      // Ignore errors handling the rejection
    }

    sendToBackground({
      action: 'sendLog',
      data: {
        type: 'error',
        url: getCurrentUrl(),
        message: message,
        stack: stack,
        timestamp: new Date().toISOString()
      }
    }).catch(error => {
      // Silently fail to avoid loops
    });
  });

  // Monitor Fetch API
  const originalFetch = window.fetch;
  window.fetch = function() {
    const url = arguments[0];
    const options = arguments[1] || {};
    const method = options.method || 'GET';
    const startTime = Date.now();
    
    return originalFetch.apply(window, arguments)
      .then(response => {
        // Clone the response to avoid consuming it
        const responseClone = response.clone();
        const duration = Date.now() - startTime;
        
        // Handle network errors and logs
        if (!response.ok) {
          // Network error (4xx or 5xx)
          sendToBackground({
            action: 'sendLog',
            data: {
              type: 'network-error',
              url: typeof url === 'string' ? url : url.toString(),
              method: method,
              status: response.status,
              statusText: response.statusText,
              timestamp: new Date().toISOString()
            }
          }).catch(() => {});
        }
        
        // Log all network activity
        responseClone.text().then(text => {
          sendToBackground({
            action: 'sendLog',
            data: {
              type: 'network',
              url: typeof url === 'string' ? url : url.toString(),
              method: method,
              status: response.status,
              duration: duration,
              size: text.length,
              timestamp: new Date().toISOString()
            }
          }).catch(() => {});
        }).catch(() => {
          // If we can't get the text, just log what we have
          sendToBackground({
            action: 'sendLog',
            data: {
              type: 'network',
              url: typeof url === 'string' ? url : url.toString(),
              method: method,
              status: response.status,
              duration: duration,
              timestamp: new Date().toISOString()
            }
          }).catch(() => {});
        });
        
        return response;
      })
      .catch(error => {
        // Network failure
        sendToBackground({
          action: 'sendLog',
          data: {
            type: 'network-error',
            url: typeof url === 'string' ? url : url.toString(),
            method: method,
            message: error.message || 'Network request failed',
            timestamp: new Date().toISOString()
          }
        }).catch(() => {});
        
        throw error; // Re-throw to not disrupt normal operation
      });
  };

  // Log page navigation and load events
  sendToBackground({
    action: 'sendLog',
    data: {
      type: 'browser',
      url: getCurrentUrl(),
      event: 'page-load',
      details: { 
        title: document.title,
        referrer: document.referrer 
      },
      timestamp: new Date().toISOString()
    }
  }).catch(() => {});

  window.addEventListener('beforeunload', function() {
    sendToBackground({
      action: 'sendLog',
      data: {
        type: 'browser',
        url: getCurrentUrl(),
        event: 'page-unload',
        timestamp: new Date().toISOString()
      }
    }).catch(() => {});
  });
}

// Initialize connection status check
function initConnectionCheck() {
  // Ping the background script to check connection status
  sendToBackground({ action: 'checkConnection' })
    .then(response => {
      if (response && response.connected) {
        console.info('DevDock Browser Monitor: Connected and monitoring this page');
      }
    })
    .catch(error => {
      console.warn('DevDock Browser Monitor: Not connected', error);
    });
}

// Start monitoring when the content script loads
try {
  initLogCapture();
  initConnectionCheck();
} catch (error) {
  // Since this is the content script itself, use the original console to avoid loops
  const originalConsoleError = console.error;
  originalConsoleError('DevDock Browser Monitor: Error initializing', error);
} 