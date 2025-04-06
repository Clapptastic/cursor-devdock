const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
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
  },
  branchingLogic: {
    type: Object,
    default: null
  }
});

const SurveySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: false,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    questions: [QuestionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'draft'
    },
    responseCount: {
      type: Number,
      default: 0
    },
    isTemplate: {
      type: Boolean,
      default: false
    },
    aiGenerated: {
      type: Boolean,
      default: false
    },
    businessContext: {
      type: String,
      required: false
    },
    targetAudience: {
      type: String,
      required: false
    },
    customStyles: {
      type: Object,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Survey', SurveySchema); 