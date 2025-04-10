import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Renovate service URL
const RENOVATE_SERVICE_URL = process.env.RENOVATE_SERVICE_URL || 'http://renovate:8099';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { action, ...data } = req.body;

    switch (action) {
      case 'scan':
        try {
          // Forward the scan request to the renovate service
          const response = await axios.post(`${RENOVATE_SERVICE_URL}/api/scan`, data);
          return res.status(200).json(response.data);
        } catch (error) {
          console.error('Error scanning dependencies:', error);
          const errorMessage = error.response?.data?.error || 'Failed to scan dependencies';
          const errorDetails = error.response?.data?.details || error.message;
          
          return res.status(error.response?.status || 500).json({ 
            success: false,
            error: errorMessage,
            details: errorDetails
          });
        }
        
      case 'update':
        try {
          // Forward the update request to the renovate service
          const response = await axios.post(`${RENOVATE_SERVICE_URL}/api/update`, {
            dependencies: data.dependencies
          });
          
          return res.status(200).json(response.data);
        } catch (error) {
          console.error('Error updating dependencies:', error);
          const errorMessage = error.response?.data?.error || 'Failed to update dependencies';
          const errorDetails = error.response?.data?.details || error.message;
          
          return res.status(error.response?.status || 500).json({ 
            success: false,
            error: errorMessage,
            details: errorDetails
          });
        }
        
      default:
        return res.status(400).json({ error: 'Invalid action. Supported actions: scan, update' });
    }
  } catch (error) {
    console.error('Error in renovate API:', error);
    return res.status(500).json({ 
      error: 'Internal server error.', 
      details: error.message 
    });
  }
} 