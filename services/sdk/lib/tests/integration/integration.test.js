"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const axios_mock_adapter_1 = __importDefault(require("axios-mock-adapter"));
const src_1 = require("../../src");
const types_1 = require("../../src/models/types");
describe('CustomerSurveySDK Integration', () => {
    let sdk;
    let mockAxios;
    beforeEach(() => {
        // Reset axios and create new mock
        mockAxios = new axios_mock_adapter_1.default(axios_1.default);
        // Initialize SDK with test config
        sdk = new src_1.CustomerSurveySDK({
            apiUrl: 'https://api.customersurvey.example',
            apiKey: 'test-api-key'
        });
    });
    afterEach(() => {
        mockAxios.restore();
    });
    describe('End-to-end survey flow', () => {
        it('should create, retrieve, update and submit responses to a survey', async () => {
            // Mock survey creation
            const newSurvey = {
                title: 'Product Feedback Survey',
                description: 'Help us improve our product',
                questions: [
                    {
                        id: 'q1',
                        type: types_1.QuestionType.TEXT,
                        text: 'What do you like about our product?',
                        required: true
                    },
                    {
                        id: 'q2',
                        type: types_1.QuestionType.RATING,
                        text: 'How would you rate our product?',
                        required: true,
                        maxRating: 5
                    }
                ]
            };
            const createdSurvey = {
                id: 'survey123',
                ...newSurvey,
                status: types_1.SurveyStatus.DRAFT,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            mockAxios.onPost('https://api.customersurvey.example/surveys').reply(201, {
                data: createdSurvey
            });
            // Mock survey retrieval
            mockAxios.onGet('https://api.customersurvey.example/surveys/survey123').reply(200, {
                data: createdSurvey
            });
            // Mock survey update
            const updatedSurvey = {
                ...createdSurvey,
                status: types_1.SurveyStatus.PUBLISHED,
                updatedAt: new Date().toISOString()
            };
            mockAxios.onPut('https://api.customersurvey.example/surveys/survey123').reply(200, {
                data: updatedSurvey
            });
            // Mock response submission
            const newResponse = {
                surveyId: 'survey123',
                answers: [
                    {
                        questionId: 'q1',
                        value: 'I like the ease of use and the interface'
                    },
                    {
                        questionId: 'q2',
                        value: 4
                    }
                ]
            };
            const submittedResponse = {
                id: 'resp456',
                ...newResponse,
                submittedAt: new Date().toISOString()
            };
            mockAxios.onPost('https://api.customersurvey.example/responses').reply(201, {
                data: submittedResponse
            });
            // Mock response statistics
            const stats = {
                surveyId: 'survey123',
                totalResponses: 5,
                completionRate: 0.95,
                averageRatings: {
                    q2: 4.2
                },
                questionBreakdowns: {
                    q2: {
                        1: 0,
                        2: 0,
                        3: 1,
                        4: 3,
                        5: 1
                    }
                }
            };
            mockAxios.onGet('https://api.customersurvey.example/responses/stats/survey123').reply(200, {
                data: stats
            });
            // Execute the workflow
            // 1. Create a survey
            const result1 = await sdk.survey.createSurvey(newSurvey);
            expect(result1.data.data).toEqual(createdSurvey);
            // 2. Get the survey
            const result2 = await sdk.survey.getSurvey('survey123');
            expect(result2.data.data).toEqual(createdSurvey);
            // 3. Update the survey status to published
            const result3 = await sdk.survey.updateSurvey('survey123', {
                status: types_1.SurveyStatus.PUBLISHED
            });
            expect(result3.data.data).toEqual(updatedSurvey);
            // 4. Submit a response to the survey
            const result4 = await sdk.response.submitResponse(newResponse);
            expect(result4.data.data).toEqual(submittedResponse);
            // 5. Get statistics for the survey
            const result5 = await sdk.response.getResponseStats('survey123');
            expect(result5.data.data).toEqual(stats);
        });
    });
    describe('AI features', () => {
        it('should analyze survey responses and provide insights', async () => {
            // Mock response data
            const responses = [
                {
                    id: 'resp1',
                    surveyId: 'survey123',
                    answers: [
                        { questionId: 'q1', value: 'The product is excellent but a bit expensive' },
                        { questionId: 'q2', value: 4 }
                    ]
                },
                {
                    id: 'resp2',
                    surveyId: 'survey123',
                    answers: [
                        { questionId: 'q1', value: 'I love the features but the UI could be improved' },
                        { questionId: 'q2', value: 3 }
                    ]
                }
            ];
            // Mock insights response
            const insights = {
                topThemes: ['price', 'features', 'UI/UX'],
                sentimentBreakdown: {
                    positive: 70,
                    neutral: 20,
                    negative: 10
                },
                keyInsights: [
                    'Customers appreciate the product features',
                    'Price is a concern for some users',
                    'UI improvements would enhance the experience'
                ],
                wordCloud: ['excellent', 'expensive', 'features', 'UI', 'improved']
            };
            mockAxios.onPost('https://api.customersurvey.example/ai/insights').reply(200, {
                data: insights
            });
            // Mock text analysis
            const textAnalysis = {
                text: 'The product is excellent but a bit expensive',
                sentiment: 'mixed',
                score: 0.6,
                entities: [
                    { type: 'PRODUCT', text: 'product' },
                    { type: 'ATTRIBUTE', text: 'expensive' }
                ]
            };
            mockAxios.onPost('https://api.customersurvey.example/ai/analyze/text').reply(200, {
                data: textAnalysis
            });
            // Execute AI workflows
            // 1. Get insights from responses
            const result1 = await sdk.ai.getInsights(responses);
            expect(result1.data.data).toEqual(insights);
            // 2. Analyze specific text
            const result2 = await sdk.ai.analyzeText('The product is excellent but a bit expensive');
            expect(result2.data.data).toEqual(textAnalysis);
        });
        it('should get survey recommendation based on goal', async () => {
            // Mock recommendation request
            const recommendationRequest = {
                goal: 'product_feedback',
                industry: 'software'
            };
            // Mock recommended survey
            const recommendedSurvey = {
                title: 'Software Product Feedback Survey',
                description: 'Help us improve our software product for business users',
                questions: [
                    {
                        type: types_1.QuestionType.RATING,
                        text: 'How would you rate the ease of use?',
                        required: true,
                        maxRating: 5
                    },
                    {
                        type: types_1.QuestionType.TEXT,
                        text: 'What features would you like to see improved?',
                        required: true
                    },
                    {
                        type: types_1.QuestionType.SINGLE_CHOICE,
                        text: 'How often do you use our product?',
                        required: true,
                        options: [
                            'Daily',
                            'Weekly',
                            'Monthly',
                            'Rarely'
                        ]
                    }
                ]
            };
            mockAxios.onPost('https://api.customersurvey.example/ai/recommend/survey').reply(200, {
                data: recommendedSurvey
            });
            // Execute recommendation workflow
            const result = await sdk.ai.recommendSurvey(recommendationRequest.goal, recommendationRequest.industry);
            expect(result.data.data).toEqual(recommendedSurvey);
        });
    });
    describe('Error handling', () => {
        it('should handle authentication errors', async () => {
            // Mock unauthorized error
            mockAxios.onGet('https://api.customersurvey.example/surveys').reply(401, {
                code: 'UNAUTHORIZED',
                message: 'Invalid API key'
            });
            // Attempt to fetch surveys
            try {
                await sdk.survey.getSurveys();
                fail('Expected error was not thrown');
            }
            catch (error) {
                expect(error).toMatchObject({
                    code: 'UNAUTHORIZED',
                    message: 'Invalid API key'
                });
            }
        });
        it('should handle rate limiting', async () => {
            // Mock rate limit error
            mockAxios.onGet('https://api.customersurvey.example/surveys').reply(429, {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests',
                retryAfter: 60
            });
            // Attempt to fetch surveys
            try {
                await sdk.survey.getSurveys();
                fail('Expected error was not thrown');
            }
            catch (error) {
                expect(error).toMatchObject({
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests'
                });
            }
        });
        it('should handle network errors', async () => {
            // Mock network error
            mockAxios.onGet('https://api.customersurvey.example/surveys').networkError();
            // Attempt to fetch surveys
            try {
                await sdk.survey.getSurveys();
                fail('Expected error was not thrown');
            }
            catch (error) {
                expect(error).toBeTruthy();
            }
        });
    });
});
