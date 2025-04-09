import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DOCS_DIR = path.join(process.cwd(), 'docs');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Document ID is required' });
    }
    
    // Prevent directory traversal attacks
    const sanitizedId = id.replace(/[^a-zA-Z0-9-_]/g, '');
    const filePath = path.join(DOCS_DIR, `${sanitizedId}.md`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract title from the content (first h1 heading)
    const titleMatch = content.match(/^# (.*?)$/m);
    const title = titleMatch ? titleMatch[1] : sanitizedId;
    
    res.status(200).json({
      id: sanitizedId,
      title,
      content
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
} 