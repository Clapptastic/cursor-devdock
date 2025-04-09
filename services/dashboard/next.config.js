module.exports = {
  reactStrictMode: true,
  env: {
    CLAUDE_TASK_MASTER_URL: process.env.CLAUDE_TASK_MASTER_URL || 'http://localhost:8002',
    SCRAPER_URL: process.env.SCRAPER_URL || 'http://localhost:8003',
    BROWSER_TOOLS_URL: process.env.BROWSER_TOOLS_URL || 'http://localhost:8004',
    MCP_REST_API_URL: process.env.MCP_REST_API_URL || 'http://localhost:8001',
  },
} 