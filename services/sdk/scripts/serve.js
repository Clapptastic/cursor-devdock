/**
 * Simple server to host the SDK package and documentation with a health endpoint
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// Port to listen on
const PORT = process.env.PORT || 8080;

// Find the SDK package
const sdkPackage = fs.readdirSync(path.join(__dirname, '..')).find(file => 
  file.startsWith('customer-survey-sdk-') && file.endsWith('.tgz')
);

// Get package details
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

// Create server
const server = http.createServer((req, res) => {
  const url = req.url;

  // Health check endpoint
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'UP',
      service: 'sdk-server',
      version: packageJson.version,
      sdk: sdkPackage || 'Package not found'
    }));
    return;
  }

  // Package endpoint
  if (url === '/sdk') {
    if (sdkPackage) {
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      res.end(fs.readFileSync(path.join(__dirname, '..', sdkPackage)));
    } else {
      res.writeHead(404);
      res.end('SDK package not found');
    }
    return;
  }
  
  // Documentation endpoint (if exists)
  if (url === '/docs' || url === '/docs/') {
    const docsPath = path.join(__dirname, '..', 'docs', 'index.html');
    if (fs.existsSync(docsPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(docsPath));
    } else {
      res.writeHead(404);
      res.end('Documentation not found. Generate it with "npm run docs"');
    }
    return;
  }
  
  // Package info
  if (url === '/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      package: sdkPackage || 'Package not found'
    }));
    return;
  }
  
  // Default route
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${packageJson.name} - ${packageJson.version}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .container { max-width: 800px; margin: 0 auto; }
          h1 { color: #333; }
          ul { padding-left: 20px; }
          li { margin-bottom: 10px; }
          a { color: #0066cc; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .package { background: #f0f0f0; padding: 10px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${packageJson.name} - v${packageJson.version}</h1>
          <p>${packageJson.description}</p>
          
          <h2>Available Routes:</h2>
          <ul>
            <li><a href="/health">/health</a> - Health check endpoint</li>
            <li><a href="/sdk">/sdk</a> - Download SDK package</li>
            <li><a href="/docs">/docs</a> - SDK Documentation</li>
            <li><a href="/info">/info</a> - Package information</li>
          </ul>
          
          <h2>SDK Package:</h2>
          <div class="package">
            ${sdkPackage || 'Package not found. Build it with "npm pack"'}
          </div>
        </div>
      </body>
    </html>
  `);
});

// Start server
server.listen(PORT, () => {
  console.log(`SDK server running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`SDK Package: http://localhost:${PORT}/sdk`);
  console.log(`Documentation: http://localhost:${PORT}/docs`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close();
  process.exit(0);
}); 