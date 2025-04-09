"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apiService_1 = require("../../src/api/apiService");
const apiClient_1 = require("../../src/api/apiClient");
const types_1 = require("../../src/models/types");
// Mock ApiClient
jest.mock('../../src/api/apiClient');
const MockApiClient = apiClient_1.ApiClient;
describe('ApiService', () => {
    let apiService;
    let mockClient;
    beforeEach(() => {
        mockClient = new MockApiClient();
        apiService = new apiService_1.ApiService(mockClient);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Survey methods', () => {
        it('should get all surveys', async () => {
            const mockSurveys = [
                { id: '1', title: 'Survey 1' },
                { id: '2', title: 'Survey 2' }
            ];
            mockClient.get.mockResolvedValue({
                data: { data: mockSurveys },
                status: 200
            });
            const result = await apiService.getSurveys();
            expect(mockClient.get).toHaveBeenCalledWith('/surveys');
            expect(result).toEqual(mockSurveys);
        });
        it('should get a survey by id', async () => {
            const mockSurvey = {
                id: '1',
                title: 'Test Survey',
                description: 'A test survey',
                questions: []
            };
            mockClient.get.mockResolvedValue({
                data: { data: mockSurvey },
                status: 200
            });
            const result = await apiService.getSurvey('1');
            expect(mockClient.get).toHaveBeenCalledWith('/surveys/1');
            expect(result).toEqual(mockSurvey);
        });
        it('should create a new survey', async () => {
            const newSurvey = {
                title: 'New Survey',
                description: 'A new test survey',
                questions: [
                    {
                        id: 'q1',
                        type: types_1.QuestionType.TEXT,
                        text: 'What is your feedback?',
                        required: true
                    }
                ]
            };
            const createdSurvey = {
                id: '3',
                ...newSurvey
            };
            mockClient.post.mockResolvedValue({
                data: { data: createdSurvey },
                status: 201
            });
            const result = await apiService.createSurvey(newSurvey);
            expect(mockClient.post).toHaveBeenCalledWith('/surveys', newSurvey);
            expect(result).toEqual(createdSurvey);
        });
        it('should update a survey', async () => {
            const surveyUpdate = {
                id: '1',
                title: 'Updated Survey',
                description: 'An updated survey'
            };
            const updatedSurvey = {
                id: '1',
                title: 'Updated Survey',
                description: 'An updated survey',
                questions: []
            };
            mockClient.put.mockResolvedValue({
                data: { data: updatedSurvey },
                status: 200
            });
            const result = await apiService.updateSurvey('1', surveyUpdate);
            expect(mockClient.put).toHaveBeenCalledWith('/surveys/1', surveyUpdate);
            expect(result).toEqual(updatedSurvey);
        });
        it('should delete a survey', async () => {
            mockClient.delete.mockResolvedValue({
                data: { success: true },
                status: 204
            });
            await apiService.deleteSurvey('1');
            expect(mockClient.delete).toHaveBeenCalledWith('/surveys/1');
        });
    });
    describe('Response methods', () => {
        it('should get responses for a survey', async () => {
            const mockResponses = [
                { id: 'r1', surveyId: '1', answers: [] },
                { id: 'r2', surveyId: '1', answers: [] }
            ];
            mockClient.get.mockResolvedValue({
                data: { data: mockResponses },
                status: 200
            });
            const result = await apiService.getResponses('1');
            expect(mockClient.get).toHaveBeenCalledWith('/responses', { params: { surveyId: '1' } });
            expect(result).toEqual(mockResponses);
        });
        it('should submit a response', async () => {
            const newResponse = {
                surveyId: '1',
                answers: [
                    {
                        questionId: 'q1',
                        value: 'This is my feedback'
                    }
                ]
            };
            const submittedResponse = {
                id: 'r3',
                ...newResponse
            };
            mockClient.post.mockResolvedValue({
                data: { data: submittedResponse },
                status: 201
            });
            const result = await apiService.submitResponse(newResponse);
            expect(mockClient.post).toHaveBeenCalledWith('/responses', newResponse);
            expect(result).toEqual(submittedResponse);
        });
        it('should get response statistics', async () => {
            const mockStats = {
                surveyId: '1',
                totalResponses: 25,
                completionRate: 0.85,
                averageRatings: { q1: 4.2 }
            };
            mockClient.get.mockResolvedValue({
                data: { data: mockStats },
                status: 200
            });
            const result = await apiService.getResponseStats('1');
            expect(mockClient.get).toHaveBeenCalledWith('/responses/stats/1');
            expect(result).toEqual(mockStats);
        });
    });
    describe('AI methods', () => {
        it('should analyze text sentiment', async () => {
            const mockAnalysis = {
                text: 'This product is great!',
                sentiment: 'positive',
                score: 0.87
            };
            mockClient.post.mockResolvedValue({
                data: { data: mockAnalysis },
                status: 200
            });
            const result = await apiService.analyzeText('This product is great!');
            expect(mockClient.post).toHaveBeenCalledWith('/ai/analyze/text', {
                text: 'This product is great!'
            });
            expect(result).toEqual(mockAnalysis);
        });
        it('should get insights from responses', async () => {
            const mockResponses = [
                { id: 'r1', surveyId: '1', answers: [] },
                { id: 'r2', surveyId: '1', answers: [] }
            ];
            const mockInsights = {
                topThemes: ['quality', 'price', 'service'],
                sentimentBreakdown: {
                    positive: 65,
                    neutral: 20,
                    negative: 15
                },
                keyInsights: ['Customers appreciate the quality']
            };
            mockClient.post.mockResolvedValue({
                data: { data: mockInsights },
                status: 200
            });
            const result = await apiService.getInsights('1', mockResponses);
            expect(mockClient.post).toHaveBeenCalledWith('/ai/insights', {
                surveyId: '1',
                responses: mockResponses
            });
            expect(result).toEqual(mockInsights);
        });
        it('should recommend a survey', async () => {
            const mockRecommendation = {
                title: 'Customer Satisfaction Survey',
                description: 'Gather feedback about customer satisfaction',
                questions: [
                    {
                        type: types_1.QuestionType.RATING,
                        text: 'How would you rate our service?',
                        required: true
                    }
                ]
            };
            mockClient.post.mockResolvedValue({
                data: { data: mockRecommendation },
                status: 200
            });
            const result = await apiService.getRecommendedSurvey({
                goal: 'customer_satisfaction',
                industry: 'retail'
            });
            expect(mockClient.post).toHaveBeenCalledWith('/ai/recommend/survey', {
                goal: 'customer_satisfaction',
                industry: 'retail'
            });
            expect(result).toEqual(mockRecommendation);
        });
    });
    describe('Error handling', () => {
        it('should handle errors from the ApiClient', async () => {
            const error = {
                code: 'NOT_FOUND',
                message: 'Survey not found',
                status: 404
            };
            mockClient.get.mockRejectedValue(error);
            await expect(apiService.getSurvey('999')).rejects.toEqual(error);
        });
    });
});
