/**
 * Helper module to setup Supabase mocks for testing
 * 
 * This module provides utility functions to create consistent
 * mock Supabase clients and responses for use in tests.
 */

/**
 * Creates a mock Supabase client with chainable methods
 * @returns {Object} A mock Supabase client
 */
function createMockSupabaseClient() {
  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    rpc: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    then: jest.fn(cb => cb({ data: [], error: null })),
    auth: {
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
      setSession: jest.fn()
    },
    storage: {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn().mockReturnThis(),
      download: jest.fn().mockReturnThis(),
      remove: jest.fn().mockReturnThis(),
      list: jest.fn().mockReturnThis(),
      getPublicUrl: jest.fn().mockReturnThis(),
    }
  };
}

/**
 * Creates a success response object
 * @param {*} data The data to include in the response
 * @returns {Object} A mock Supabase success response
 */
function createSuccessResponse(data = []) {
  return { data, error: null };
}

/**
 * Creates an error response object
 * @param {string} message The error message
 * @param {string} code The error code
 * @returns {Object} A mock Supabase error response
 */
function createErrorResponse(message = 'An error occurred', code = 'GENERIC_ERROR') {
  return { 
    data: null, 
    error: { 
      message, 
      code 
    } 
  };
}

/**
 * Creates common mock data for tables
 * @returns {Object} Mock data for different tables
 */
function createMockData() {
  return {
    users: [
      { 
        id: 'user-uuid-1', 
        email: 'admin@example.com', 
        name: 'Admin User', 
        role: 'admin', 
        created_at: '2023-01-01T00:00:00.000Z' 
      },
      { 
        id: 'user-uuid-2', 
        email: 'user@example.com', 
        name: 'Regular User', 
        role: 'user', 
        created_at: '2023-01-02T00:00:00.000Z' 
      }
    ],
    surveys: [
      { 
        id: 'survey-uuid-1', 
        title: 'Customer Feedback', 
        user_id: 'user-uuid-1', 
        created_at: '2023-01-10T00:00:00.000Z',
        questions: [
          { id: 'q1', text: 'How would you rate our service?', type: 'rating' },
          { id: 'q2', text: 'What improvements would you suggest?', type: 'text' }
        ]
      }
    ],
    responses: [
      {
        id: 'response-uuid-1',
        survey_id: 'survey-uuid-1',
        respondent_email: 'customer@example.com',
        created_at: '2023-01-15T00:00:00.000Z',
        answers: [
          { question_id: 'q1', value: 4 },
          { question_id: 'q2', value: 'Faster delivery times would be great' }
        ]
      }
    ],
    analyses: [
      {
        id: 'analysis-uuid-1',
        survey_id: 'survey-uuid-1',
        created_at: '2023-01-20T00:00:00.000Z',
        summary: 'Overall positive feedback with suggestions for improvement',
        insights: [
          { type: 'positive', text: 'High satisfaction ratings' },
          { type: 'suggestion', text: 'Consider improving delivery times' }
        ]
      }
    ]
  };
}

/**
 * Setup the Supabase mock with predefined responses
 * @param {Object} mockClient The mock Supabase client to setup
 * @param {Object} mockData Custom mock data to use
 */
function setupMockResponses(mockClient, mockData = createMockData()) {
  // Default setup for success responses
  mockClient.from.mockImplementation((tableName) => {
    return {
      ...mockClient,
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(createSuccessResponse(mockData[tableName] || [])),
      then: jest.fn(cb => cb(createSuccessResponse(mockData[tableName] || [])))
    };
  });
  
  // Setup for auth responses
  mockClient.auth.getSession.mockResolvedValue({
    data: { 
      session: { 
        user: mockData.users[0],
        access_token: 'mock-token'
      } 
    },
    error: null
  });
  
  mockClient.auth.getUser.mockResolvedValue({
    data: { user: mockData.users[0] },
    error: null
  });
  
  // Return the configured client
  return mockClient;
}

module.exports = {
  createMockSupabaseClient,
  createSuccessResponse,
  createErrorResponse,
  createMockData,
  setupMockResponses
}; 