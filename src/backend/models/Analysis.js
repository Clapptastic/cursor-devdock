const mongoose = require('mongoose');

const InsightSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  analysisText: {
    type: String,
    required: true
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral', 'mixed'],
    required: false
  },
  keywords: {
    type: [String],
    default: []
  },
  score: {
    type: Number,
    min: 0,
    max: 10,
    required: false
  }
});

const AnalysisSchema = new mongoose.Schema(
  {
    survey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Survey',
      required: true
    },
    summary: {
      type: String,
      required: true
    },
    insights: [InsightSchema],
    aiGenerated: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Ensure one analysis per survey
AnalysisSchema.index({ survey: 1 }, { unique: true });

module.exports = mongoose.model('Analysis', AnalysisSchema); 