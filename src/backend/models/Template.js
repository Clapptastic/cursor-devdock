const mongoose = require('mongoose');

const TemplateQuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'multiplechoice', 'checkbox', 'rating', 'boolean'],
    default: 'text'
  },
  required: {
    type: Boolean,
    default: false
  },
  options: {
    type: [String],
    default: []
  }
});

const TemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a template name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: false,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      trim: true
    },
    questions: [TemplateQuestionSchema],
    tags: {
      type: [String],
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    aiGenerated: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Add text index for search functionality
TemplateSchema.index({ name: 'text', description: 'text', category: 'text', tags: 'text' });

module.exports = mongoose.model('Template', TemplateSchema); 