import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const MCP_REST_API_URL = process.env.MCP_REST_API_URL || 'http://mcp-rest-api:8001';
    const response = await axios.get(`${MCP_REST_API_URL}/apis`);
    
    // Transform data to include connection status
    const connectionsWithStatus = response.data.map((api: any) => ({
      ...api,
      status: 'connected' // In a real implementation, would check actual status
    }));
    
    res.status(200).json(connectionsWithStatus);
  } catch (error) {
    console.error('Error fetching API connections:', error);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
} 