const request = require('supertest');
const http = require('http');
const apiGateway = require('../../api-gateway/src/index');
const surveyService = require('../../survey-service/src/index');
const responseService = require('../../response-service/src/index');

let apiServer;
let surveyServer;
let responseServer;
let surveyPort;
let responsePort;

// Mock data
const testSurvey = {
  id: 'e2e-test-survey-id',
  title: 'E2E Test Survey',
  description: 'Test survey for end-to-end testing',
  questions: [
    {
      id: 'q1',
      text: 'How would you rate our service?',
      type: 'rating',
      required: true,
      options: { min: 1, max: 5 }
    },
    {
      id: 'q2',
      text: 'Any additional feedback?',
      type: 'text',
      required: false
    }
  ]
};

// Mock supabase for survey service
jest.mock('@supabase/supabase-js', () => {
  const mockInstance = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockImplementation((data) => ({
      data: [{ ...data, id: 'e2e-test-survey-id' }],
      error: null,
    })),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    data: [testSurvey],
    error: null,
  };
  
  return {
    createClient: jest.fn().mockReturnValue(mockInstance)
  };
});

describe('End-to-End Survey Response Flow', () => {
  beforeAll(async () => {
    // Start survey service
    surveyServer = http.createServer(surveyService);
    await new Promise(resolve => {
      surveyServer.listen(0, () => {
        surveyPort = surveyServer.address().port;
        resolve();
      });
    });
    
    // Start response service
    responseServer = http.createServer(responseService);
    await new Promise(resolve => {
      responseServer.listen(0, () => {
        responsePort = responseServer.address().port;
        resolve();
      });
    });
    
    // Set environment variables
    process.env.SURVEY_SERVICE_URL = `http://localhost:${surveyPort}`;
    process.env.RESPONSE_SERVICE_URL = `http://localhost:${responsePort}`;
    
    // Start API Gateway
    apiServer = http.createServer(apiGateway);
    await new Promise(resolve => {
      apiServer.listen(0, resolve);
    });
  });
  
  afterAll(async () => {
    await new Promise(resolve => apiServer.close(resolve));
    await new Promise(resolve => surveyServer.close(resolve));
    await new Promise(resolve => responseServer.close(resolve));
  });

  it('should create a survey, submit responses, and retrieve statistics', async () => {
    // Step 1: Create a new survey
    let createSurveyResponse = await request(apiServer)
      .post('/api/surveys')
      .send({
        title: 'E2E Test Survey',
        description: 'Test survey for end-to-end testing',
        questions: [
          {
            id: 'q1',
            text: 'How would you rate our service?',
            type: 'rating',
            required: true,
            options: { min: 1, max: 5 }
          },
          {
            id: 'q2',
            text: 'Any additional feedback?',
            type: 'text',
            required: false
          }
        ]
      });
      
    expect(createSurveyResponse.status).toBe(201);
    expect(createSurveyResponse.body).toHaveProperty('id', 'e2e-test-survey-id');
    
    const surveyId = createSurveyResponse.body.id;
    
    // Step 2: Submit a response to the survey
    let submitResponseResponse = await request(apiServer)
      .post('/api/responses')
      .send({
        surveyId: surveyId,
        answers: [
          {
            questionId: 'q1',
            value: 5,
            type: 'rating'
          },
          {
            questionId: 'q2',
            value: 'Great service, very satisfied!',
            type: 'text'
          }
        ],
        respondentEmail: 'test@example.com'
      });
      
    expect(submitResponseResponse.status).toBe(201);
    expect(submitResponseResponse.body).toHaveProperty('id');
    
    // Step 3: Get survey by ID
    let getSurveyResponse = await request(apiServer)
      .get(`/api/surveys/${surveyId}`);
      
    expect(getSurveyResponse.status).toBe(200);
    expect(getSurveyResponse.body).toHaveProperty('id', surveyId);
    
    // Step 4: Get responses for the survey
    let getResponsesResponse = await request(apiServer)
      .get(`/api/responses?surveyId=${surveyId}`);
      
    expect(getResponsesResponse.status).toBe(200);
    expect(Array.isArray(getResponsesResponse.body)).toBe(true);
    
    // Step 5: Get statistics for the survey
    let getStatsResponse = await request(apiServer)
      .get(`/api/responses/stats/${surveyId}`);
      
    expect(getStatsResponse.status).toBe(200);
    expect(getStatsResponse.body).toHaveProperty('totalResponses');
  });
}); 