import { NextApiRequest, NextApiResponse } from 'next';
import { scrapeURL } from '../../lib/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { url, selectors, stealthMode } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    const response = await scrapeURL(url, selectors, stealthMode);
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error during scrape operation:', error);
    res.status(500).json({ error: 'Failed to scrape the URL' });
  }
} 