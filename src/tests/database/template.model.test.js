/**
 * Template model tests
 */
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearDatabase } = require('../../database/testUtils');
const Template = require('../../backend/models/Template');
const User = require('../../backend/models/User');

describe('Template Model', () => {
  // Connect to the in-memory database before running tests
  beforeAll(async () => {
    await connectTestDB();
  });

  // Clear all test data after each test
  afterEach(async () => {
    await clearDatabase();
  });

  // Disconnect and cleanup after all tests are done
  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('Template Schema', () => {
    it('should create a template successfully', async () => {
      // Create a test user first
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });

      const templateData = {
        name: 'Customer Feedback Template',
        description: 'A template for gathering customer feedback',
        category: 'Feedback',
        questions: [
          {
            text: 'How would you rate our service?',
            type: 'rating',
            required: true,
            options: ['1', '2', '3', '4', '5']
          },
          {
            text: 'What did you like most about our service?',
            type: 'text',
            required: false
          }
        ],
        tags: ['customer', 'feedback', 'service'],
        createdBy: user._id,
        isPublic: true
      };

      const template = await Template.create(templateData);
      
      // Verify the template was created
      expect(template._id).toBeDefined();
      expect(template.name).toBe(templateData.name);
      expect(template.description).toBe(templateData.description);
      expect(template.category).toBe(templateData.category);
      expect(template.questions).toHaveLength(2);
      expect(template.tags).toEqual(expect.arrayContaining(['customer', 'feedback', 'service']));
      expect(template.createdBy.toString()).toBe(user._id.toString());
      expect(template.isPublic).toBe(true);
      expect(template.aiGenerated).toBe(false); // Default value
      expect(template.createdAt).toBeDefined();
      expect(template.updatedAt).toBeDefined();
    });

    it('should require a name', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test2@example.com',
        password: 'password123',
        role: 'user'
      });

      const templateData = {
        // name is missing
        description: 'A template for gathering customer feedback',
        category: 'Feedback',
        questions: [
          {
            text: 'How would you rate our service?',
            type: 'rating',
            required: true,
            options: ['1', '2', '3', '4', '5']
          }
        ],
        createdBy: user._id
      };

      // Attempt to create a template without a name should fail
      await expect(Template.create(templateData)).rejects.toThrow();
    });

    it('should require a createdBy reference', async () => {
      const templateData = {
        name: 'Test Template',
        description: 'A test template',
        category: 'Test',
        questions: [
          {
            text: 'Test question',
            type: 'text',
            required: true
          }
        ],
        // createdBy is missing
      };

      // Attempt to create a template without createdBy should fail
      await expect(Template.create(templateData)).rejects.toThrow();
    });

    it('should enforce maximum length for name and description', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test3@example.com',
        password: 'password123',
        role: 'user'
      });

      // Create a name that's too long (101 characters)
      const longName = 'a'.repeat(101);
      
      // Create a description that's too long (501 characters)
      const longDescription = 'a'.repeat(501);

      const templateData = {
        name: longName,
        description: longDescription,
        category: 'Test',
        questions: [
          {
            text: 'Test question',
            type: 'text',
            required: true
          }
        ],
        createdBy: user._id
      };

      // Attempt to create a template with too long name/description should fail
      await expect(Template.create(templateData)).rejects.toThrow();
    });

    it('should validate question types', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test4@example.com',
        password: 'password123',
        role: 'user'
      });

      const templateData = {
        name: 'Test Template',
        description: 'A test template',
        category: 'Test',
        questions: [
          {
            text: 'Invalid Question',
            type: 'invalid-type', // Invalid question type
            required: true
          }
        ],
        createdBy: user._id
      };

      // Attempt to create a template with invalid question type should fail
      await expect(Template.create(templateData)).rejects.toThrow();
    });
  });

  describe('Template Text Index', () => {
    it('should create text index on specified fields', async () => {
      // Get the indexes of the Template collection
      const indexes = await Template.collection.getIndexes();
      
      // Check if the text index exists
      const textIndex = Object.values(indexes).find(index => index.name.includes('text'));
      
      // Verify text index fields
      expect(textIndex).toBeDefined();
      expect(textIndex.key).toHaveProperty('name', 'text');
      expect(textIndex.key).toHaveProperty('description', 'text');
      expect(textIndex.key).toHaveProperty('category', 'text');
      expect(textIndex.key).toHaveProperty('tags', 'text');
    });
  });
}); 