import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const RENOVATE_CONFIG_PATH = process.env.RENOVATE_CONFIG_PATH || '/tmp/renovate.json';
const RENOVATE_SERVICE_URL = process.env.RENOVATE_SERVICE_URL || 'http://renovate:8003';

type ConfigResponse = {
  success: boolean;
  config?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConfigResponse>
) {
  try {
    // GET request to fetch current configuration
    if (req.method === 'GET') {
      try {
        // First try to get from the service
        try {
          const serviceResponse = await axios.get(`${RENOVATE_SERVICE_URL}/config`);
          if (serviceResponse.status === 200 && serviceResponse.data) {
            return res.status(200).json({
              success: true,
              config: serviceResponse.data
            });
          }
        } catch (serviceError) {
          console.log('Failed to get config from service, falling back to file:', serviceError);
        }

        // Fallback to reading from file
        if (fs.existsSync(RENOVATE_CONFIG_PATH)) {
          const configFile = fs.readFileSync(RENOVATE_CONFIG_PATH, 'utf8');
          const config = JSON.parse(configFile);
          return res.status(200).json({
            success: true,
            config
          });
        }

        // Return default config if nothing exists
        return res.status(200).json({
          success: true,
          config: {
            extends: ['config:base'],
            baseBranches: ['main'],
            dependencyDashboard: true,
            labels: ['dependencies']
          }
        });
      } catch (error: any) {
        console.error('Error fetching renovate config:', error);
        return res.status(500).json({
          success: false,
          error: `Failed to fetch configuration: ${error.message}`
        });
      }
    }
    
    // POST request to save configuration
    else if (req.method === 'POST') {
      try {
        const { config } = req.body;
        
        if (!config) {
          return res.status(400).json({
            success: false,
            error: 'No configuration provided'
          });
        }

        // First try to save via the service
        try {
          const serviceResponse = await axios.post(`${RENOVATE_SERVICE_URL}/config`, { config });
          if (serviceResponse.status === 200 || serviceResponse.status === 201) {
            return res.status(200).json({
              success: true
            });
          }
        } catch (serviceError) {
          console.log('Failed to save config via service, falling back to file:', serviceError);
        }
        
        // Fallback to writing to file
        const configStr = JSON.stringify(config, null, 2);
        const dirPath = path.dirname(RENOVATE_CONFIG_PATH);
        
        // Make sure directory exists
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        fs.writeFileSync(RENOVATE_CONFIG_PATH, configStr);
        
        return res.status(200).json({
          success: true
        });
      } catch (error: any) {
        console.error('Error saving renovate config:', error);
        return res.status(500).json({
          success: false,
          error: `Failed to save configuration: ${error.message}`
        });
      }
    }
    
    // Handle invalid methods
    else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
      });
    }
  } catch (error: any) {
    console.error('Unexpected error in renovate config endpoint:', error);
    return res.status(500).json({
      success: false,
      error: `Unexpected error: ${error.message}`
    });
  }
} 