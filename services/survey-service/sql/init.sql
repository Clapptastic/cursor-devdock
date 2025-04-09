-- surveys table
CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    is_template BOOLEAN NOT NULL DEFAULT false,
    is_shared BOOLEAN NOT NULL DEFAULT false,
    version INTEGER NOT NULL DEFAULT 1,
    original_survey_id UUID,
    template_id UUID,
    settings JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for surveys table
CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_surveys_template ON surveys(is_template, status) 
WHERE is_template = true;

-- survey_shares table
CREATE TABLE IF NOT EXISTS survey_shares (
    id UUID PRIMARY KEY,
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    user_id UUID,
    email TEXT,
    permission TEXT NOT NULL DEFAULT 'view',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

-- Create indexes for survey_shares table
CREATE INDEX IF NOT EXISTS idx_survey_shares_survey_user ON survey_shares(survey_id, user_id);
CREATE INDEX IF NOT EXISTS idx_survey_shares_survey_email ON survey_shares(survey_id, email);

-- Add constraint to ensure either user_id or email is provided
ALTER TABLE survey_shares ADD CONSTRAINT check_user_or_email 
CHECK (
    (user_id IS NOT NULL) OR (email IS NOT NULL)
);

-- health_check table for connection test
CREATE TABLE IF NOT EXISTS health_check (
    id SERIAL PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'ok',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial health check record
INSERT INTO health_check (status) VALUES ('ok') ON CONFLICT DO NOTHING;

-- Function to check survey access
CREATE OR REPLACE FUNCTION check_survey_access(survey_id UUID, user_id UUID)
RETURNS TABLE (
    access_level TEXT,
    permission TEXT,
    share_id UUID
) AS $$
BEGIN
    -- Check if user is the owner
    IF EXISTS (SELECT 1 FROM surveys WHERE id = survey_id AND user_id = check_survey_access.user_id) THEN
        RETURN QUERY SELECT 'owner'::TEXT, 'full'::TEXT, NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if user has shared access
    RETURN QUERY 
    SELECT 
        'shared'::TEXT,
        share.permission,
        share.id
    FROM 
        survey_shares share
    WHERE 
        share.survey_id = check_survey_access.survey_id
        AND share.user_id = check_survey_access.user_id
        AND (share.expires_at IS NULL OR share.expires_at > NOW());
        
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to get all surveys shared with a user
CREATE OR REPLACE FUNCTION get_user_shared_surveys(user_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    permission TEXT
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        s.id,
        s.title,
        s.description,
        s.status,
        s.user_id,
        s.created_at,
        s.updated_at,
        ss.permission
    FROM 
        surveys s
    JOIN 
        survey_shares ss ON s.id = ss.survey_id
    WHERE 
        ss.user_id = get_user_shared_surveys.user_id
        AND (ss.expires_at IS NULL OR ss.expires_at > NOW());
        
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security Policies

-- Enable RLS on surveys table
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_shares ENABLE ROW LEVEL SECURITY;

-- Survey policies
CREATE POLICY surveys_auth ON surveys
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY surveys_shared ON surveys
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM survey_shares
            WHERE survey_id = surveys.id
            AND user_id = auth.uid()
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

CREATE POLICY surveys_templates ON surveys
    FOR SELECT
    TO authenticated
    USING (
        is_template = true AND status = 'active'
    );

-- Survey shares policies
CREATE POLICY shares_owner ON survey_shares
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE id = survey_shares.survey_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY shares_user ON survey_shares
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
    ); 