# Customer Survey Database Schema

## User Collection
```
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  company: String (optional),
  role: String (enum: 'user', 'admin'),
  createdAt: Date,
  updatedAt: Date
}
```

## Survey Collection
```
{
  _id: ObjectId,
  title: String,
  description: String (optional),
  questions: [
    {
      text: String,
      type: String (enum: 'text', 'multiplechoice', 'checkbox', 'rating', 'boolean'),
      required: Boolean,
      options: [String] (for multiplechoice and checkbox),
      branchingLogic: Object (optional)
    }
  ],
  createdBy: ObjectId (ref: 'User'),
  status: String (enum: 'draft', 'active', 'closed'),
  responseCount: Number,
  isTemplate: Boolean,
  aiGenerated: Boolean,
  businessContext: String (optional),
  targetAudience: String (optional),
  customStyles: Object (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## Response Collection
```
{
  _id: ObjectId,
  survey: ObjectId (ref: 'Survey'),
  respondent: ObjectId (ref: 'User', optional),
  answers: [
    {
      questionId: ObjectId,
      questionText: String,
      questionType: String,
      value: Mixed (String/Array/Number depending on question type)
    }
  ],
  completed: Boolean,
  ipAddress: String (optional),
  userAgent: String (optional),
  metadata: Object (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## Template Collection
```
{
  _id: ObjectId,
  name: String,
  description: String (optional),
  category: String,
  questions: [
    {
      text: String,
      type: String (enum: 'text', 'multiplechoice', 'checkbox', 'rating', 'boolean'),
      required: Boolean,
      options: [String] (for multiplechoice and checkbox)
    }
  ],
  tags: [String],
  createdBy: ObjectId (ref: 'User'),
  isPublic: Boolean,
  aiGenerated: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Analysis Collection
```
{
  _id: ObjectId,
  survey: ObjectId (ref: 'Survey'),
  summary: String,
  insights: [
    {
      question: String,
      analysisText: String,
      sentiment: String (optional),
      keywords: [String],
      score: Number (optional)
    }
  ],
  aiGenerated: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Relationships
- User -> Survey (1:Many) - A user can create multiple surveys
- Survey -> Response (1:Many) - A survey can have multiple responses
- Survey -> Analysis (1:1) - A survey has one analysis report
- User -> Response (1:Many) - A user can submit multiple responses
- Template -> Survey (1:Many) - A template can be used for multiple surveys 