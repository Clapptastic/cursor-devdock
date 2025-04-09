/**
 * Database Seeder for Customer Survey Application
 * 
 * This script populates the database with initial data:
 * - Reference data (industries, business stages, customer segments, question types)
 * - Demo users
 * - Sample templates
 * - Example surveys and responses
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getSupabase } = require('./supabase');
const {
  industries,
  businessStages,
  customerSegments,
  questionTypes
} = require('./seed/reference_data');

/**
 * Seed reference data into the database
 */
async function seedReferenceData() {
  console.log('Seeding reference data...');
  const supabase = getSupabase();

  try {
    // Seed industries
    console.log('Seeding industries...');
    const { error: industriesError } = await supabase
      .from('industries')
      .upsert(industries, { onConflict: 'name' })
      .select();
    
    if (industriesError) throw new Error(`Error seeding industries: ${industriesError.message}`);
    
    // Seed business stages
    console.log('Seeding business stages...');
    const { error: stagesError } = await supabase
      .from('business_stages')
      .upsert(businessStages, { onConflict: 'name' })
      .select();
    
    if (stagesError) throw new Error(`Error seeding business stages: ${stagesError.message}`);
    
    // Seed customer segments
    console.log('Seeding customer segments...');
    const { error: segmentsError } = await supabase
      .from('customer_segments')
      .upsert(customerSegments, { onConflict: 'name' })
      .select();
    
    if (segmentsError) throw new Error(`Error seeding customer segments: ${segmentsError.message}`);
    
    // Seed question types
    console.log('Seeding question types...');
    const { error: typesError } = await supabase
      .from('question_types')
      .upsert(questionTypes, { onConflict: 'name' })
      .select();
    
    if (typesError) throw new Error(`Error seeding question types: ${typesError.message}`);

    console.log('Reference data seeded successfully');
    return true;
  } catch (error) {
    console.error('Error seeding reference data:', error);
    throw error;
  }
}

/**
 * Seed demo users into the database
 */
async function seedUsers() {
  console.log('Seeding users...');
  const supabase = getSupabase();
  
  try {
    // Create demo users
    const salt = await bcrypt.genSalt(10);
    const demoUsers = [
      {
        id: uuidv4(),
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', salt),
        name: 'Admin User',
        role: 'admin'
      },
      {
        id: uuidv4(),
        email: 'user@example.com',
        password: await bcrypt.hash('password123', salt),
        name: 'Regular User',
        role: 'user'
      }
    ];
    
    // Loop through demo users and insert them if they don't exist
    for (const user of demoUsers) {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (!existingUser) {
        const { error } = await supabase
          .from('users')
          .insert(user);
        
        if (error) throw new Error(`Error seeding user ${user.email}: ${error.message}`);
      }
    }
    
    console.log('Users seeded successfully');
    return demoUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

/**
 * Seed sample templates into the database
 */
async function seedTemplates(adminUserId) {
  console.log('Seeding templates...');
  const supabase = getSupabase();
  
  try {
    // Get reference data IDs
    const { data: industryData } = await supabase
      .from('industries')
      .select('id, name')
      .in('name', ['SaaS', 'E-commerce']);
    
    const { data: stageData } = await supabase
      .from('business_stages')
      .select('id, name')
      .in('name', ['MVP Testing', 'Product-Market Fit']);
    
    const { data: segmentData } = await supabase
      .from('customer_segments')
      .select('id, name')
      .in('name', ['B2B', 'B2C']);
    
    // Map reference data by name for easy lookup
    const industries = {};
    const stages = {};
    const segments = {};
    
    industryData.forEach(item => industries[item.name] = item.id);
    stageData.forEach(item => stages[item.name] = item.id);
    segmentData.forEach(item => segments[item.name] = item.id);
    
    // Create sample templates
    const templates = [
      {
        id: uuidv4(),
        title: 'SaaS Product-Market Fit Survey',
        description: 'Survey template for SaaS companies validating product-market fit',
        industry_id: industries['SaaS'],
        business_stage_id: stages['Product-Market Fit'],
        customer_segment_id: segments['B2B'],
        tags: ['saas', 'product-market fit', 'b2b'],
        created_by: adminUserId,
        is_public: true
      },
      {
        id: uuidv4(),
        title: 'E-commerce Customer Satisfaction',
        description: 'Survey template for e-commerce stores to gauge customer satisfaction',
        industry_id: industries['E-commerce'],
        business_stage_id: stages['MVP Testing'],
        customer_segment_id: segments['B2C'],
        tags: ['ecommerce', 'customer satisfaction', 'feedback'],
        created_by: adminUserId,
        is_public: true
      }
    ];
    
    // Insert templates
    for (const template of templates) {
      const { error } = await supabase
        .from('templates')
        .insert(template);
      
      if (error) throw new Error(`Error seeding template ${template.title}: ${error.message}`);
    }
    
    console.log('Templates seeded successfully');
    return templates;
  } catch (error) {
    console.error('Error seeding templates:', error);
    throw error;
  }
}

/**
 * Seed sample questions for templates
 */
async function seedQuestions(templateId, questionTypeMap) {
  console.log(`Seeding questions for template ${templateId}...`);
  const supabase = getSupabase();
  
  try {
    // Get template info to determine which questions to create
    const { data: template } = await supabase
      .from('templates')
      .select('title, industry_id, business_stage_id, customer_segment_id')
      .eq('id', templateId)
      .single();
    
    // Define questions based on template type
    let questions = [];
    
    if (template.title.includes('SaaS')) {
      questions = [
        {
          id: uuidv4(),
          template_id: templateId,
          question_text: 'How would you rate the overall value our product provides?',
          description: 'On a scale of 1-10, with 10 being extremely valuable',
          question_type_id: questionTypeMap['Rating Scale'],
          is_required: true,
          settings: {
            minValue: 1,
            maxValue: 10,
            stepSize: 1,
            showLabels: true,
            minLabel: 'Not valuable',
            maxLabel: 'Extremely valuable'
          },
          order_position: 1
        },
        {
          id: uuidv4(),
          template_id: templateId,
          question_text: 'Which features do you find most useful?',
          description: 'Select all that apply',
          question_type_id: questionTypeMap['Checkbox'],
          is_required: true,
          settings: {
            allowOther: true,
            randomizeOptions: false
          },
          order_position: 2
        },
        {
          id: uuidv4(),
          template_id: templateId,
          question_text: 'How likely are you to recommend our product to a colleague?',
          description: 'Net Promoter Score question',
          question_type_id: questionTypeMap['Net Promoter Score'],
          is_required: true,
          settings: {
            showLabels: true,
            detractorLabel: 'Not likely at all',
            promoterLabel: 'Extremely likely'
          },
          order_position: 3
        },
        {
          id: uuidv4(),
          template_id: templateId,
          question_text: 'What would you most like to see improved in our product?',
          description: 'Please be specific',
          question_type_id: questionTypeMap['Open-Ended'],
          is_required: false,
          settings: {
            multiline: true,
            placeholder: 'Share your thoughts...'
          },
          order_position: 4
        }
      ];
    } else if (template.title.includes('E-commerce')) {
      questions = [
        {
          id: uuidv4(),
          template_id: templateId,
          question_text: 'How satisfied were you with your recent purchase?',
          description: 'On a scale of 1-5, with 5 being extremely satisfied',
          question_type_id: questionTypeMap['Rating Scale'],
          is_required: true,
          settings: {
            minValue: 1,
            maxValue: 5,
            stepSize: 1,
            showLabels: true,
            minLabel: 'Very dissatisfied',
            maxLabel: 'Very satisfied'
          },
          order_position: 1
        },
        {
          id: uuidv4(),
          template_id: templateId,
          question_text: 'What was your primary reason for shopping with us?',
          description: 'Select the best option',
          question_type_id: questionTypeMap['Multiple Choice'],
          is_required: true,
          settings: {
            allowOther: true,
            randomizeOptions: false,
            displayStyle: 'radio'
          },
          order_position: 2
        },
        {
          id: uuidv4(),
          template_id: templateId,
          question_text: 'How would you rate our website usability?',
          description: 'Please rate each aspect of our website',
          question_type_id: questionTypeMap['Matrix'],
          is_required: false,
          settings: {
            rows: [
              'Navigation ease',
              'Search functionality',
              'Checkout process',
              'Product images',
              'Product descriptions'
            ],
            columns: [
              'Poor',
              'Fair',
              'Good',
              'Very Good',
              'Excellent'
            ],
            columnType: 'radio'
          },
          order_position: 3
        },
        {
          id: uuidv4(),
          template_id: templateId,
          question_text: 'How likely are you to shop with us again?',
          description: 'Net Promoter Score question',
          question_type_id: questionTypeMap['Net Promoter Score'],
          is_required: true,
          settings: {
            showLabels: true,
            detractorLabel: 'Not likely at all',
            promoterLabel: 'Extremely likely'
          },
          order_position: 4
        }
      ];
    }
    
    // Insert questions
    for (const question of questions) {
      const { error } = await supabase
        .from('questions')
        .insert(question);
      
      if (error) throw new Error(`Error seeding question for template ${templateId}: ${error.message}`);
      
      // If the question type requires options, seed them
      if (['Multiple Choice', 'Checkbox', 'Dropdown'].includes(question.question_type_id)) {
        await seedAnswerOptions(question.id);
      }
    }
    
    console.log(`Questions seeded successfully for template ${templateId}`);
    return questions;
  } catch (error) {
    console.error(`Error seeding questions for template ${templateId}:`, error);
    throw error;
  }
}

/**
 * Seed answer options for multiple choice, checkbox questions
 */
async function seedAnswerOptions(questionId) {
  console.log(`Seeding answer options for question ${questionId}...`);
  const supabase = getSupabase();
  
  try {
    // Get question info to determine which options to create
    const { data: question } = await supabase
      .from('questions')
      .select('question_text, question_type_id')
      .eq('id', questionId)
      .single();
    
    // Define options based on question text
    let options = [];
    
    if (question.question_text.includes('features')) {
      options = [
        { option_text: 'Dashboard & Analytics', order_position: 1 },
        { option_text: 'Reporting Features', order_position: 2 },
        { option_text: 'Integration Capabilities', order_position: 3 },
        { option_text: 'User Management', order_position: 4 },
        { option_text: 'Mobile App', order_position: 5 }
      ];
    } else if (question.question_text.includes('primary reason')) {
      options = [
        { option_text: 'Price', order_position: 1 },
        { option_text: 'Product Selection', order_position: 2 },
        { option_text: 'Website User Experience', order_position: 3 },
        { option_text: 'Customer Service', order_position: 4 },
        { option_text: 'Shipping Options', order_position: 5 },
        { option_text: 'Previous Experience', order_position: 6 }
      ];
    } else {
      // Default options if no specific match
      options = [
        { option_text: 'Option 1', order_position: 1 },
        { option_text: 'Option 2', order_position: 2 },
        { option_text: 'Option 3', order_position: 3 }
      ];
    }
    
    // Add question_id to each option
    options = options.map(option => ({
      ...option,
      id: uuidv4(),
      question_id: questionId
    }));
    
    // Insert options
    const { error } = await supabase
      .from('answer_options')
      .insert(options);
    
    if (error) throw new Error(`Error seeding answer options for question ${questionId}: ${error.message}`);
    
    console.log(`Answer options seeded successfully for question ${questionId}`);
    return options;
  } catch (error) {
    console.error(`Error seeding answer options for question ${questionId}:`, error);
    throw error;
  }
}

/**
 * Seed sample surveys into the database
 */
async function seedSurveys(userId, templates) {
  console.log('Seeding surveys...');
  const supabase = getSupabase();
  
  try {
    const surveys = [];
    
    for (const template of templates) {
      const surveyId = uuidv4();
      const survey = {
        id: surveyId,
        title: `${template.title} - Demo Survey`,
        description: `Demo survey created from the ${template.title} template`,
        template_id: template.id,
        user_id: userId,
        settings: {
          showProgressBar: true,
          allowSave: true,
          confirmationMessage: 'Thank you for completing this survey!'
        },
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      };
      
      const { error } = await supabase
        .from('surveys')
        .insert(survey);
      
      if (error) throw new Error(`Error seeding survey for template ${template.id}: ${error.message}`);
      
      surveys.push(survey);
      
      // Seed survey questions by copying from template
      await seedSurveyQuestions(template.id, surveyId);
    }
    
    console.log('Surveys seeded successfully');
    return surveys;
  } catch (error) {
    console.error('Error seeding surveys:', error);
    throw error;
  }
}

/**
 * Seed survey questions by copying from template
 */
async function seedSurveyQuestions(templateId, surveyId) {
  console.log(`Creating survey questions for survey ${surveyId} from template ${templateId}...`);
  const supabase = getSupabase();
  
  try {
    // Get template questions
    const { data: templateQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('template_id', templateId);
    
    if (questionsError) throw new Error(`Error getting template questions: ${questionsError.message}`);
    
    // Create survey questions from template questions
    for (const templateQuestion of templateQuestions) {
      const surveyQuestionId = uuidv4();
      const surveyQuestion = {
        id: surveyQuestionId,
        survey_id: surveyId,
        original_question_id: templateQuestion.id,
        question_text: templateQuestion.question_text,
        description: templateQuestion.description,
        question_type_id: templateQuestion.question_type_id,
        is_required: templateQuestion.is_required,
        settings: templateQuestion.settings,
        order_position: templateQuestion.order_position
      };
      
      const { error: insertError } = await supabase
        .from('survey_questions')
        .insert(surveyQuestion);
      
      if (insertError) throw new Error(`Error creating survey question: ${insertError.message}`);
      
      // For questions with options, copy those too
      if (['Multiple Choice', 'Checkbox', 'Dropdown'].some(type => 
        templateQuestion.question_type_id.includes(type))) {
        // Get original options
        const { data: options, error: optionsError } = await supabase
          .from('answer_options')
          .select('*')
          .eq('question_id', templateQuestion.id);
        
        if (optionsError) throw new Error(`Error getting answer options: ${optionsError.message}`);
        
        // Create survey options
        if (options && options.length > 0) {
          const surveyOptions = options.map(option => ({
            id: uuidv4(),
            survey_question_id: surveyQuestionId,
            original_option_id: option.id,
            option_text: option.option_text,
            order_position: option.order_position
          }));
          
          const { error: optionsInsertError } = await supabase
            .from('survey_answer_options')
            .insert(surveyOptions);
          
          if (optionsInsertError) throw new Error(`Error creating survey options: ${optionsInsertError.message}`);
        }
      }
    }
    
    console.log(`Survey questions created successfully for survey ${surveyId}`);
    return true;
  } catch (error) {
    console.error(`Error creating survey questions for survey ${surveyId}:`, error);
    throw error;
  }
}

/**
 * Seed sample responses into the database
 */
async function seedResponses(surveys) {
  console.log('Seeding responses...');
  const supabase = getSupabase();
  
  try {
    for (const survey of surveys) {
      // Create 5 responses per survey
      for (let i = 0; i < 5; i++) {
        const responseId = uuidv4();
        const response = {
          id: responseId,
          survey_id: survey.id,
          respondent_email: `respondent${i + 1}@example.com`,
          respondent_name: `Respondent ${i + 1}`,
          metadata: {
            browser: 'Chrome',
            device: 'Desktop',
            source: 'Direct'
          },
          completed: true,
          created_at: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString() // Random date in the last week
        };
        
        const { error } = await supabase
          .from('responses')
          .insert(response);
        
        if (error) throw new Error(`Error seeding response for survey ${survey.id}: ${error.message}`);
        
        // Get survey questions to create answers for
        const { data: surveyQuestions } = await supabase
          .from('survey_questions')
          .select('*')
          .eq('survey_id', survey.id);
        
        // Create answers for each question
        for (const question of surveyQuestions) {
          await seedAnswer(responseId, question);
        }
      }
    }
    
    console.log('Responses seeded successfully');
    return true;
  } catch (error) {
    console.error('Error seeding responses:', error);
    throw error;
  }
}

/**
 * Seed sample answer for a question
 */
async function seedAnswer(responseId, question) {
  const supabase = getSupabase();
  
  try {
    let answer = {
      id: uuidv4(),
      response_id: responseId,
      survey_question_id: question.id,
      created_at: new Date().toISOString()
    };
    
    // Get question type
    const { data: questionType } = await supabase
      .from('question_types')
      .select('name')
      .eq('id', question.question_type_id)
      .single();
    
    // Generate appropriate answer based on question type
    switch (questionType.name) {
      case 'Rating Scale':
        answer.numerical_value = Math.floor(Math.random() * (question.settings.maxValue - question.settings.minValue + 1)) + question.settings.minValue;
        break;
        
      case 'Net Promoter Score':
        answer.numerical_value = Math.floor(Math.random() * 11); // 0-10
        break;
        
      case 'Multiple Choice':
      case 'Dropdown':
        // Get options for this question
        const { data: options } = await supabase
          .from('survey_answer_options')
          .select('id')
          .eq('survey_question_id', question.id);
        
        if (options && options.length > 0) {
          // Select a random option
          const randomOption = options[Math.floor(Math.random() * options.length)];
          answer.selected_options = [randomOption.id];
        }
        break;
        
      case 'Checkbox':
        // Get options for this question
        const { data: checkboxOptions } = await supabase
          .from('survey_answer_options')
          .select('id')
          .eq('survey_question_id', question.id);
        
        if (checkboxOptions && checkboxOptions.length > 0) {
          // Select 1-3 random options
          const numToSelect = Math.floor(Math.random() * 3) + 1;
          const shuffled = [...checkboxOptions].sort(() => 0.5 - Math.random());
          answer.selected_options = shuffled.slice(0, Math.min(numToSelect, checkboxOptions.length)).map(o => o.id);
        }
        break;
        
      case 'Open-Ended':
        const responses = [
          'This is a great product that helps me solve my problems effectively.',
          'I like the features but would appreciate more customization options.',
          'The support team is responsive and helpful whenever I have questions.',
          'It has a steep learning curve but is powerful once you understand it.',
          'I would recommend this to others in my industry.'
        ];
        answer.answer_text = responses[Math.floor(Math.random() * responses.length)];
        break;
        
      case 'Matrix':
        const matrixAnswers = {};
        if (question.settings && question.settings.rows) {
          question.settings.rows.forEach((row, i) => {
            // For each row, select a random column
            const colIndex = Math.floor(Math.random() * (question.settings.columns?.length || 5));
            matrixAnswers[`row_${i}`] = colIndex;
          });
        }
        answer.selected_options = matrixAnswers;
        break;
        
      default:
        answer.answer_text = 'Sample answer for ' + questionType.name;
    }
    
    const { error } = await supabase
      .from('answers')
      .insert(answer);
    
    if (error) throw new Error(`Error seeding answer for response ${responseId} and question ${question.id}: ${error.message}`);
    
    return answer;
  } catch (error) {
    console.error(`Error seeding answer for response ${responseId} and question ${question.id}:`, error);
    throw error;
  }
}

/**
 * Main seed function that orchestrates the seeding process
 */
async function seed() {
  console.log('Starting database seeding...');
  
  try {
    // Seed reference data (industries, business stages, etc.)
    await seedReferenceData();
    
    // Seed users
    const users = await seedUsers();
    const adminUser = users.find(user => user.role === 'admin');
    
    // Get question type mapping for easier referencing
    const supabase = getSupabase();
    const { data: questionTypeData } = await supabase
      .from('question_types')
      .select('id, name');
    
    const questionTypeMap = {};
    questionTypeData.forEach(type => questionTypeMap[type.name] = type.id);
    
    // Seed templates
    const templates = await seedTemplates(adminUser.id);
    
    // Seed questions for each template
    for (const template of templates) {
      await seedQuestions(template.id, questionTypeMap);
    }
    
    // Seed surveys
    const surveys = await seedSurveys(adminUser.id, templates);
    
    // Seed responses
    await seedResponses(surveys);
    
    console.log('Database seeding completed successfully.');
    return { success: true };
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  }
}

// Run the seed function if this script is called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed completed successfully');
      process.exit(0);
    })
    .catch(err => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = { seed }; 