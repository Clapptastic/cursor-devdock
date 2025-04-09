-- survey_responses table
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY,
    survey_id UUID NOT NULL,
    respondent_id UUID,
    respondent_email TEXT,
    respondent_ip TEXT,
    completion_time INTEGER,
    status TEXT NOT NULL DEFAULT 'completed',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Create indexes for survey_responses table
CREATE INDEX IF NOT EXISTS idx_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_survey_respondent ON survey_responses(survey_id, respondent_id);
CREATE INDEX IF NOT EXISTS idx_responses_survey_email ON survey_responses(survey_id, respondent_email);
CREATE INDEX IF NOT EXISTS idx_responses_survey_date ON survey_responses(survey_id, created_at);

-- response_answers table
CREATE TABLE IF NOT EXISTS response_answers (
    id UUID PRIMARY KEY,
    response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL,
    answer_value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for response_answers table
CREATE INDEX IF NOT EXISTS idx_answers_response_id ON response_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_answers_response_question ON response_answers(response_id, question_id);

-- Function to calculate survey response rate
CREATE OR REPLACE FUNCTION get_survey_response_rate(survey_id UUID)
RETURNS TABLE (
    response_rate FLOAT,
    total_responses INTEGER,
    completed_responses INTEGER
) AS $$
DECLARE
    completed INT;
    total INT;
BEGIN
    -- Get total responses
    SELECT COUNT(*) INTO total
    FROM survey_responses
    WHERE survey_id = get_survey_response_rate.survey_id;
    
    -- Get completed responses
    SELECT COUNT(*) INTO completed
    FROM survey_responses
    WHERE survey_id = get_survey_response_rate.survey_id
    AND status = 'completed';
    
    -- Calculate response rate
    RETURN QUERY 
    SELECT 
        CASE WHEN total > 0 THEN (completed::FLOAT / total) ELSE 0 END,
        total,
        completed;
END;
$$ LANGUAGE plpgsql;

-- Function to get response analytics
CREATE OR REPLACE FUNCTION get_response_analytics(survey_id UUID)
RETURNS JSONB AS $$
DECLARE
    total_count INT;
    status_counts JSONB;
    completion_rate FLOAT;
    avg_completion_time FLOAT;
    responses_by_date JSONB;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_count
    FROM survey_responses
    WHERE survey_id = get_response_analytics.survey_id;
    
    -- Get counts by status
    SELECT jsonb_object_agg(status, count)
    INTO status_counts
    FROM (
        SELECT status, COUNT(*) as count
        FROM survey_responses
        WHERE survey_id = get_response_analytics.survey_id
        GROUP BY status
    ) AS status_counts;
    
    -- Get completion rate
    SELECT response_rate INTO completion_rate
    FROM get_survey_response_rate(survey_id);
    
    -- Get average completion time
    SELECT AVG(completion_time) INTO avg_completion_time
    FROM survey_responses
    WHERE survey_id = get_response_analytics.survey_id
    AND completion_time IS NOT NULL;
    
    -- Get responses by date
    SELECT jsonb_object_agg(date, count)
    INTO responses_by_date
    FROM (
        SELECT 
            TO_CHAR(created_at, 'YYYY-MM-DD') as date, 
            COUNT(*) as count
        FROM survey_responses
        WHERE survey_id = get_response_analytics.survey_id
        GROUP BY date
        ORDER BY date
    ) AS date_counts;
    
    -- Return the analytics object
    RETURN jsonb_build_object(
        'totalResponses', total_count,
        'statusBreakdown', COALESCE(status_counts, '{}'::jsonb),
        'completionRate', COALESCE(completion_rate, 0),
        'averageCompletionTime', COALESCE(avg_completion_time, 0),
        'responsesByDate', COALESCE(responses_by_date, '{}'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_answers ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies for survey_responses

-- Survey owners can view responses for their surveys
CREATE POLICY responses_survey_owner ON survey_responses
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE id = survey_responses.survey_id
            AND user_id = auth.uid()
        )
    );

-- Respondents can view their own responses
CREATE POLICY responses_respondent ON survey_responses
    FOR SELECT
    TO authenticated
    USING (
        respondent_id = auth.uid()
    );

-- Anyone can create a response
CREATE POLICY responses_create ON survey_responses
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Row Level Security Policies for response_answers

-- Survey owners can view answers for their surveys
CREATE POLICY answers_survey_owner ON response_answers
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM survey_responses r
            JOIN surveys s ON r.survey_id = s.id
            WHERE r.id = response_answers.response_id
            AND s.user_id = auth.uid()
        )
    );

-- Respondents can view their own answers
CREATE POLICY answers_respondent ON response_answers
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM survey_responses
            WHERE id = response_answers.response_id
            AND respondent_id = auth.uid()
        )
    );

-- Anyone can create answers for their responses
CREATE POLICY answers_create ON response_answers
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM survey_responses
            WHERE id = response_answers.response_id
            AND (
                respondent_id = auth.uid() OR
                respondent_id IS NULL
            )
        )
    ); 