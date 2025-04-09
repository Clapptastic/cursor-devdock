"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apiClient_1 = require("../../src/api/apiClient");
const axios_1 = __importDefault(require("axios"));
const axios_mock_adapter_1 = __importDefault(require("axios-mock-adapter"));
// Mock axios for testing
const mockAxios = new axios_mock_adapter_1.default(axios_1.default);
describe('ApiClient', () => {
    let apiClient;
    const baseUrl = 'http://localhost:3000';
    beforeEach(() => {
        mockAxios.reset();
        apiClient = new apiClient_1.ApiClient(baseUrl, 5000);
    });
    describe('GET requests', () => {
        it('should make a successful GET request', async () => {
            const mockData = { id: '1', name: 'Test' };
            mockAxios.onGet(`${baseUrl}/test`).reply(200, { data: mockData });
            const response = await apiClient.get('/test');
            expect(response.data).toEqual({ data: mockData });
        });
        it('should include query parameters in GET request', async () => {
            mockAxios.onGet(`${baseUrl}/test`).reply(config => {
                expect(config.params).toEqual({ page: 1, limit: 10 });
                return [200, { data: [] }];
            });
            await apiClient.get('/test', { params: { page: 1, limit: 10 } });
        });
    });
    describe('POST requests', () => {
        it('should make a successful POST request', async () => {
            const requestData = { name: 'Test Item' };
            const responseData = { id: '1', ...requestData };
            mockAxios.onPost(`${baseUrl}/test`, requestData).reply(201, { data: responseData });
            const response = await apiClient.post('/test', requestData);
            expect(response.data).toEqual({ data: responseData });
        });
    });
    describe('PUT requests', () => {
        it('should make a successful PUT request', async () => {
            const requestData = { id: '1', name: 'Updated Item' };
            mockAxios.onPut(`${baseUrl}/test/1`, requestData).reply(200, { data: requestData });
            const response = await apiClient.put('/test/1', requestData);
            expect(response.data).toEqual({ data: requestData });
        });
    });
    describe('DELETE requests', () => {
        it('should make a successful DELETE request', async () => {
            mockAxios.onDelete(`${baseUrl}/test/1`).reply(204, { success: true });
            const response = await apiClient.delete('/test/1');
            expect(response.data).toEqual({ success: true });
        });
    });
    describe('Authentication', () => {
        it('should add authentication token to request headers', async () => {
            apiClient.setAuthToken('test-token');
            mockAxios.onGet(`${baseUrl}/test`).reply(config => {
                expect(config.headers?.Authorization).toBe('Bearer test-token');
                return [200, {}];
            });
            await apiClient.get('/test');
        });
        it('should not include auth header when not set', async () => {
            mockAxios.onGet(`${baseUrl}/test`).reply(config => {
                expect(config.headers?.Authorization).toBeUndefined();
                return [200, {}];
            });
            await apiClient.get('/test');
        });
    });
    describe('Error handling', () => {
        it('should handle 404 errors', async () => {
            mockAxios.onGet(`${baseUrl}/not-found`).reply(404, {
                code: 'NOT_FOUND',
                message: 'Resource not found'
            });
            try {
                await apiClient.get('/not-found');
                fail('Expected error was not thrown');
            }
            catch (error) {
                expect(error.status).toBe(404);
                expect(error.code).toBe('NOT_FOUND');
                expect(error.message).toBe('Resource not found');
            }
        });
        it('should handle network errors', async () => {
            mockAxios.onGet(`${baseUrl}/test`).networkError();
            try {
                await apiClient.get('/test');
                fail('Expected error was not thrown');
            }
            catch (error) {
                expect(error.code).toBe('NETWORK_ERROR');
            }
        });
        it('should handle timeout errors', async () => {
            mockAxios.onGet(`${baseUrl}/test`).timeout();
            try {
                await apiClient.get('/test');
                fail('Expected error was not thrown');
            }
            catch (error) {
                expect(error.code).toBe('REQUEST_TIMEOUT');
            }
        });
    });
    describe('Debug mode', () => {
        it('should log requests in debug mode', async () => {
            const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
            const debugClient = new apiClient_1.ApiClient(baseUrl, 5000);
            // Mock internal implementation to set debug mode
            debugClient.debugEnabled = true;
            mockAxios.onGet(`${baseUrl}/test`).reply(200, { data: [] });
            await debugClient.get('/test');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
