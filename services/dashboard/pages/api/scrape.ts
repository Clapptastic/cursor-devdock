import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const SCRAPER_URL = process.env.SCRAPER_URL || 'http://scraper:8003';
    const { url, selectors, stealthMode } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    const endpoint = stealthMode ? '/stealth-scrape' : '/scrape';
    const response = await axios.post(`${SCRAPER_URL}${endpoint}`, {
      url,
      selectors
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error during
} 