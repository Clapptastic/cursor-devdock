import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const CLAUDE_TASK_MASTER_URL = process.env.CLAUDE_TASK_MASTER_URL || 'http://claude-task-master:8002';
    const response = await axios.get(`${CLAUDE_TASK_MASTER_URL}/api/tasks`);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching Claude tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
} 