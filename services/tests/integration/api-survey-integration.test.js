const request = require('supertest');
const apiGateway = require('../../api-gateway/src/index');
const surveyService = require('../../survey-service/src/index');
const http = require('http');

let apiServer;
let surveyServer;
let surveyPort;

// Mock data
const mockSurveys = [
  {
    id: '1',
    title: 'Customer Feedback Survey',
    description: 'Help us improve our service',
    questions: [
      {
        id: '1',
        text: 'How satisfied are you with our service?',
        type: 'rating',
        required: true,
        options: { min: 1, max: 5 }
      }
    ],
    createdAt: new Date().toISOString(),
    active: true
  }
];

// Mock DB calls in survey service
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    data: mockSurveys,
    error: null,
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  })
}));

describe('API Gateway to Survey Service Integration', () => {
  beforeAll(async () => {
    // Start survey service on a random port
    surveyServer = http.createServer(surveyService);
    await new Promise(resolve => {
      surveyServer.listen(0, () => {
        surveyPort = surveyServer.address().port;
        resolve();
      });
    });
    
    // Set environment variable to point to the survey service
    process.env.SURVEY_SERVICE_URL = `http://localhost:${surveyPort}`;
    
    // Start API Gateway
    apiServer = http.createServer(apiGateway);
    await new Promise(resolve => {
      apiServer.listen(0, resolve);
    });
  });
  
  afterAll(async () => {
    await new Promise(resolve => apiServer.close(resolve));
    await new Promise(resolve => surveyServer.close(resolve));
  });

  it('should fetch all surveys through the API Gateway', async () => {
    const response = await request(apiServer)
      .get('/api/surveys');
      
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('id', '1');
  });

  it('should fetch a single survey by id through the API Gateway', async () => {
    const response = await request(apiServer)
      .get('/api/surveys/1');
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', '1');
    expect(response.body).toHaveProperty('title', 'Customer Feedback Survey');
  });

  it('should create a new survey through the API Gateway', async () => {
    const newSurvey = {
      title: 'New Integration Test Survey',
      description: 'Testing integration between services',
      questions: [
        {
          text: 'How would you rate this integration?',
          type: 'rating',
          required: true,
          options: { min: 1, max: 5 }
        }
      ]
    };
    
    const response = await request(apiServer)
      .post('/api/surveys')
      .send(newSurvey);
      
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title', newSurvey.title);
  });
}); 