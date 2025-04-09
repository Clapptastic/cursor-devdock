/**
 * Migration: Initialize Survey System Schema
 * 
 * This migration creates the database schema for the Customer Survey application
 * with tables for industries, business_stages, customer_segments, templates,
 * surveys, questions, responses, and analysis.
 */

const { getSupabase } = require('../supabase');

/**
 * Creates the database schema for the Customer Survey application
 */
async function up() {
  const supabase = getSupabase();
  console.log('Starting schema migration...');

  try {
    // Create industries table
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'industries',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created industries table');
    
    // Create business_stages table
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'business_stages',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created business_stages table');
    
    // Create customer_segments table
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'customer_segments',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created customer_segments table');
    
    // Create templates table
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'templates',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        description TEXT,
        industry_id UUID REFERENCES industries(id),
        business_stage_id UUID REFERENCES business_stages(id),
        customer_segment_id UUID REFERENCES customer_segments(id),
        tags JSONB,
        created_by UUID REFERENCES auth.users(id),
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created templates table');
    
    // Create question_types table
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'question_types',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        settings_schema JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created question_types table');
    
    // Create questions table
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'questions',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        description TEXT,
        question_type_id UUID REFERENCES question_types(id),
        is_required BOOLEAN DEFAULT false,
        settings JSONB,
        order_position INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created questions table');
    
    // Create answer_options table
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'answer_options',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL,
        order_position INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created answer_options table');
    
    // Create surveys table
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'surveys',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        description TEXT,
        template_id UUID REFERENCES templates(id),
        user_id UUID REFERENCES auth.users(id),
        settings JSONB,
        status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created surveys table');
    
    // Create survey_questions table to handle customized questions for surveys
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'survey_questions',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
        original_question_id UUID REFERENCES questions(id),
        question_text TEXT NOT NULL,
        description TEXT,
        question_type_id UUID REFERENCES question_types(id),
        is_required BOOLEAN DEFAULT false,
        settings JSONB,
        order_position INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created survey_questions table');
    
    // Create survey_answer_options table for customized answer options
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'survey_answer_options',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        survey_question_id UUID REFERENCES survey_questions(id) ON DELETE CASCADE,
        original_option_id UUID REFERENCES answer_options(id),
        option_text TEXT NOT NULL,
        order_position INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created survey_answer_options table');
    
    // Create responses table
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'responses',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
        respondent_email TEXT,
        respondent_name TEXT,
        metadata JSONB,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created responses table');
    
    // Create answers table
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'answers',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
        survey_question_id UUID REFERENCES survey_questions(id),
        answer_text TEXT,
        selected_options JSONB,
        numerical_value DOUBLE PRECISION,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created answers table');
    
    // Create analyses table
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'analyses',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
        title TEXT,
        summary TEXT,
        insights JSONB,
        sentiment_scores JSONB,
        common_themes JSONB,
        recommendations JSONB,
        created_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created analyses table');
    
    // Create assumptions table
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'assumptions',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id),
        survey_id UUID REFERENCES surveys(id),
        assumption_text TEXT NOT NULL,
        status TEXT CHECK (status IN ('unvalidated', 'validated', 'invalidated', 'partially_validated')),
        evidence JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created assumptions table');
    
    // Create exports table
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'exports',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id),
        survey_id UUID REFERENCES surveys(id),
        analysis_id UUID REFERENCES analyses(id),
        format TEXT NOT NULL,
        file_url TEXT,
        status TEXT CHECK (status IN ('pending', 'completed', 'failed')),
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      `
    });
    console.log('Created exports table');
    
    // Create integrations table
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'integrations',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id),
        integration_type TEXT NOT NULL,
        credentials JSONB,
        settings JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created integrations table');
    
    // Create personas table
    await supabase.rpc('create_table_if_not_exists', {
      table_name: 'personas',
      definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id),
        survey_id UUID REFERENCES surveys(id),
        name TEXT NOT NULL,
        description TEXT,
        attributes JSONB,
        pain_points JSONB,
        goals JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `
    });
    console.log('Created personas table');
    
    console.log('Schema migration completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error during schema migration:', error);
    throw error;
  }
}

/**
 * Drops all tables in reverse order of their creation
 */
async function down() {
  const supabase = getSupabase();
  console.log('Starting schema rollback...');

  try {
    const tables = [
      'personas',
      'integrations',
      'exports',
      'assumptions',
      'analyses',
      'answers',
      'responses',
      'survey_answer_options',
      'survey_questions',
      'surveys',
      'answer_options',
      'questions',
      'question_types',
      'templates',
      'customer_segments',
      'business_stages',
      'industries'
    ];
    
    for (const table of tables) {
      await supabase.rpc('drop_table_if_exists', { table_name: table });
      console.log(`Dropped ${table} table`);
    }
    
    console.log('Schema rollback completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error during schema rollback:', error);
    throw error;
  }
}

module.exports = { up, down }; 