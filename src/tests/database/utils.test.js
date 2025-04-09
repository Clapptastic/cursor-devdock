/**
 * Database utilities tests
 */
const mongoose = require('mongoose');
const {
  isValidObjectId,
  createObjectId,
  getConnectionStatus,
  getModelsInfo
} = require('../../database/utils');
const { connectTestDB, disconnectTestDB } = require('../../database/testUtils');

describe('Database Utils', () => {
  // Connect to the in-memory database
  beforeAll(async () => {
    await connectTestDB();
  });

  // Disconnect from the in-memory database
  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('ObjectId Functions', () => {
    it('should validate a valid ObjectId', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      expect(isValidObjectId(validId)).toBe(true);
    });

    it('should invalidate an invalid ObjectId', () => {
      const invalidId = 'invalid-id';
      expect(isValidObjectId(invalidId)).toBe(false);
    });

    it('should create a new ObjectId', () => {
      const id = createObjectId();
      expect(id).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(isValidObjectId(id.toString())).toBe(true);
    });
  });

  describe('Connection Status Functions', () => {
    it('should get connection status', () => {
      const status = getConnectionStatus();
      
      // Connection should be active during tests
      expect(status).toBeDefined();
      expect(status.state).toBeDefined();
      expect(status.status).toBeDefined();
      expect(typeof status.status).toBe('string');
      
      // Status should reflect connected state (state === 1 for connected)
      expect(status.state).toBe(1);
      expect(status.status).toBe('connected');
      
      // Models should be an array
      expect(Array.isArray(status.models)).toBe(true);
    });
  });

  describe('Model Info Functions', () => {
    // Register some test models
    beforeAll(() => {
      // Define test models if they don't exist
      if (!mongoose.models.TestModel) {
        mongoose.model('TestModel', new mongoose.Schema({
          name: String,
          value: Number
        }));
      }
    });

    it('should get models info', () => {
      const modelsInfo = getModelsInfo();
      
      // Should return an object with model information
      expect(modelsInfo).toBeDefined();
      expect(typeof modelsInfo).toBe('object');
      
      // Should include test model
      expect(modelsInfo.TestModel).toBeDefined();
      
      // Should have correct schema information
      expect(modelsInfo.TestModel.name).toBe('TestModel');
      expect(modelsInfo.TestModel.collection).toBeDefined();
      expect(modelsInfo.TestModel.schema).toBeDefined();
      expect(modelsInfo.TestModel.schema.paths).toContain('name');
      expect(modelsInfo.TestModel.schema.paths).toContain('value');
    });
  });
}); 