import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const BROWSER_TOOLS_URL = process.env.BROWSER_TOOLS_URL || 'http://browser-tools:8004';
    const response = await axios.get(`${BROWSER_TOOLS_URL}/api/logs`);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching browser logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
} 