# Browser Monitoring Tool - Chrome Extension

## Overview

The Browser Monitoring Tool has been enhanced with a Chrome browser extension that enables real-time monitoring of web applications. This document explains how the extension works, how to install it, and how it integrates with the Browser Monitoring Tool.

## Implementation Details

### 1. UI Enhancements

Both the dashboard interface and the browser-tools service standalone UI have been updated to:
- Detect if the Chrome extension is installed and connected
- Display the connection status to users
- Provide a prompt to install the extension if not detected
- Show clear instructions on extension usage

### 2. Extension Architecture

The Chrome extension consists of several key components:

- **Manifest (manifest.json)**: Defines the extension's permissions, content scripts, and browser action
- **Background Script (background.js)**: Maintains connection with the Browser Tools service and handles communication
- **Content Script (content.js)**: Injects monitoring code into web pages to capture logs, errors, and network activity
- **Popup UI (popup.html/popup.js)**: Provides a user interface for configuring the extension and viewing status

### 3. Communication Flow

1. The extension connects to the Browser Tools service via HTTP to check service health and WebSocket for real-time communication
2. When a user visits a webpage, the content script captures browser activity and sends it to the background script
3. The background script forwards the data to the Browser Tools service
4. The Browser Tools service stores and displays the data in the dashboard

### 4. Installation Detection

The Browser Monitoring Tool automatically detects if the extension is installed by:

1. Attempting to communicate with the extension using `chrome.runtime.sendMessage`
2. Checking for responses that indicate the extension is installed and connected
3. Updating the UI to reflect the current connection status
4. Periodically checking connection status to ensure real-time feedback

## Installation Instructions

### For Development

1. Go to `services/browser-tools/extension/` directory
2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` directory

### For Production

Before deploying to production:

1. Obtain a Chrome Web Store Developer account
2. Publish the extension to the Chrome Web Store
3. Update the extension ID in:
   - `services/dashboard/pages/browser-tools.tsx`
   - `services/browser-tools/public/index.html`
   - `services/browser-tools/extension/background.js`

## User Flow

1. User opens the Browser Monitoring Tool
2. The tool checks if the extension is installed
3. If not installed, a prompt is displayed with an "Install Chrome Extension" button
4. When the user clicks the button, they're directed to the Chrome Web Store
5. After installation, the extension automatically connects to the Browser Tools service
6. The UI updates to show the connected status and begins displaying monitored data

## Customization

The extension can be customized by:
- Changing the `serverUrl` in the extension settings (default: http://localhost:8004)
- Adjusting the log level to control verbosity
- Enabling/disabling auto-connection

## Debugging

If the extension doesn't connect:
1. Check if the Browser Tools service is running
2. Verify the extension is installed correctly
3. Check the extension's popup UI for connection status
4. Look for errors in the browser console related to the extension

## Files Added/Modified

1. **Dashboard UI**:
   - Modified: `services/dashboard/pages/browser-tools.tsx`

2. **Browser Tools Service**:
   - Modified: `services/browser-tools/public/index.html`
   
3. **Extension Files**:
   - Added: `services/browser-tools/extension/manifest.json`
   - Added: `services/browser-tools/extension/background.js`
   - Added: `services/browser-tools/extension/content.js`
   - Added: `services/browser-tools/extension/popup.html`
   - Added: `services/browser-tools/extension/popup.js`
   - Added: `services/browser-tools/extension/README.md`

4. **Documentation**:
   - Added: `services/browser-tools/BROWSER_EXTENSION.md` 