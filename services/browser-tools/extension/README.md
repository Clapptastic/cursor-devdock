# DevDock Browser Monitor Extension

A Chrome extension for the DevDock Browser Monitoring Tools that captures and sends browser activity to the DevDock platform.

## Features

- Real-time monitoring of console logs and errors
- Network request and response tracking
- Performance metrics collection
- Error tracking with stack traces
- Automatic page navigation and event tracking

## Installation for Development

To install the extension for development:

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked"
5. Select the `extension` directory from this repository

## Installation for Users

The extension can be installed from the Chrome Web Store:

1. Visit the [DevDock Browser Monitor](https://chrome.google.com/webstore/detail/devdock-browser-monitor/extension-id) page in the Chrome Web Store
2. Click "Add to Chrome"
3. Click "Add extension" in the confirmation dialog

## Configuration

The extension automatically connects to the DevDock Browser Tools service running on `http://localhost:8004`. 

You can configure the extension's settings by clicking on its icon in the Chrome toolbar and going to the Settings tab.

Available settings:
- Server URL: The URL of your DevDock Browser Tools service
- Auto-connect: Whether to automatically connect on startup
- Log Level: The level of detail for logs

## Extension ID

When publishing to the Chrome Web Store, you'll receive a unique extension ID. You'll need to update:

1. The extension ID in the browser-tools.tsx file:
   ```javascript
   window.chrome.runtime.sendMessage('devdock-browser-monitor-extension-id', ...
   ```

2. The URL for installation in the browser-tools UI:
   ```javascript
   window.open('https://chrome.google.com/webstore/detail/devdock-browser-monitor/extension-id', '_blank');
   ```

3. The same ID in the browser-tools/public/index.html page:
   ```javascript
   window.chrome.runtime.sendMessage('devdock-browser-monitor-extension-id', ...
   ```

## Building for Production

To build the extension for production:

1. Make sure all files are in place
2. Install any required build dependencies
3. Zip the contents of the extension directory (not the directory itself)
4. Submit the zip file to the Chrome Web Store Developer Dashboard

## Connecting to DevDock

Once installed, the extension will attempt to connect to the DevDock Browser Tools service. 

1. Open the DevDock Browser Tools interface
2. The interface will detect if the extension is installed and connected
3. If not connected, click the "Install Chrome Extension" button to install it
4. Once connected, browser activity will be automatically monitored and displayed in real-time

## Troubleshooting

If the extension doesn't connect:

1. Make sure the DevDock Browser Tools service is running at the configured URL
2. Check that the extension is properly installed in Chrome
3. Try clicking the extension icon and using the "Connect" button
4. Check the browser console for any error messages from the extension

## Privacy

This extension only sends data to the configured DevDock service, which by default is a local service running on your machine. No data is sent to external servers unless you explicitly configure it to do so. 