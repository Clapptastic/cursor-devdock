-- Function to create health_check table
CREATE OR REPLACE FUNCTION create_health_check_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS health_check (
    id SERIAL PRIMARY KEY,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  
  -- Insert initial health check record
  INSERT INTO health_check (status) VALUES ('ok')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to create users table
CREATE OR REPLACE FUNCTION create_users_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    company TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  
  -- Create index for email lookup
  CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
  
  -- Enable Row Level Security
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  
  -- Create RLS policies
  CREATE POLICY "Users can view their own profile" 
    ON users FOR SELECT 
    USING (auth.uid() = id);
    
  CREATE POLICY "Users can update their own profile" 
    ON users FOR UPDATE 
    USING (auth.uid() = id);
    
  CREATE POLICY "Admins can view all users" 
    ON users FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admins can insert users" 
    ON users FOR INSERT 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admins can update all users" 
    ON users FOR UPDATE 
    USING (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admins can delete users" 
    ON users FOR DELETE 
    USING (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to create templates table
CREATE OR REPLACE FUNCTION create_templates_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    questions JSONB NOT NULL,
    tags TEXT[],
    created_by UUID REFERENCES users(id),
    is_public BOOLEAN DEFAULT FALSE,
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  
  -- Create index for category lookup
  CREATE INDEX IF NOT EXISTS idx_templates_category ON templates (category);
  
  -- Create index for created_by lookup
  CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates (created_by);
  
  -- Create index for public templates
  CREATE INDEX IF NOT EXISTS idx_templates_public ON templates (is_public);
  
  -- Enable Row Level Security
  ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
  
  -- Create RLS policies
  CREATE POLICY "Users can view their own templates" 
    ON templates FOR SELECT 
    USING (auth.uid() = created_by);
    
  CREATE POLICY "Users can view public templates" 
    ON templates FOR SELECT 
    USING (is_public = TRUE);
    
  CREATE POLICY "Users can insert their own templates" 
    ON templates FOR INSERT 
    WITH CHECK (auth.uid() = created_by);
    
  CREATE POLICY "Users can update their own templates" 
    ON templates FOR UPDATE 
    USING (auth.uid() = created_by);
    
  CREATE POLICY "Users can delete their own templates" 
    ON templates FOR DELETE 
    USING (auth.uid() = created_by);
    
  CREATE POLICY "Admins can view all templates" 
    ON templates FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admins can update all templates" 
    ON templates FOR UPDATE 
    USING (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admins can delete templates" 
    ON templates FOR DELETE 
    USING (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to create surveys table
CREATE OR REPLACE FUNCTION create_surveys_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    template_id UUID REFERENCES templates(id),
    created_by UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'draft',
    expires_at TIMESTAMPTZ,
    sharing_token TEXT UNIQUE,
    embed_token TEXT UNIQUE,
    response_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  
  -- Create index for created_by lookup
  CREATE INDEX IF NOT EXISTS idx_surveys_created_by ON surveys (created_by);
  
  -- Create index for template_id lookup
  CREATE INDEX IF NOT EXISTS idx_surveys_template_id ON surveys (template_id);
  
  -- Create index for status lookup
  CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys (status);
  
  -- Create index for sharing_token lookup
  CREATE INDEX IF NOT EXISTS idx_surveys_sharing_token ON surveys (sharing_token);
  
  -- Create index for embed_token lookup
  CREATE INDEX IF NOT EXISTS idx_surveys_embed_token ON surveys (embed_token);
  
  -- Enable Row Level Security
  ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
  
  -- Create RLS policies
  CREATE POLICY "Users can view their own surveys" 
    ON surveys FOR SELECT 
    USING (auth.uid() = created_by);
    
  CREATE POLICY "Users can insert their own surveys" 
    ON surveys FOR INSERT 
    WITH CHECK (auth.uid() = created_by);
    
  CREATE POLICY "Users can update their own surveys" 
    ON surveys FOR UPDATE 
    USING (auth.uid() = created_by);
    
  CREATE POLICY "Users can delete their own surveys" 
    ON surveys FOR DELETE 
    USING (auth.uid() = created_by);
    
  CREATE POLICY "Admins can view all surveys" 
    ON surveys FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admins can update all surveys" 
    ON surveys FOR UPDATE 
    USING (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admins can delete surveys" 
    ON surveys FOR DELETE 
    USING (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Published surveys are accessible by sharing token" 
    ON surveys FOR SELECT 
    USING (
      status = 'published' AND 
      sharing_token IS NOT NULL AND
      (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- Function to create responses table
CREATE OR REPLACE FUNCTION create_responses_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    respondent JSONB,
    answers JSONB NOT NULL,
    completed BOOLEAN DEFAULT TRUE,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  
  -- Create index for survey_id lookup
  CREATE INDEX IF NOT EXISTS idx_responses_survey_id ON responses (survey_id);
  
  -- Create trigger function to update response_count on survey
  CREATE OR REPLACE FUNCTION update_survey_response_count()
  RETURNS TRIGGER AS $$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      UPDATE surveys
      SET response_count = response_count + 1
      WHERE id = NEW.survey_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE surveys
      SET response_count = response_count - 1
      WHERE id = OLD.survey_id;
    END IF;
    RETURN NULL;
  END;
  $$ LANGUAGE plpgsql;
  
  -- Create trigger on responses table
  CREATE TRIGGER update_survey_response_count
  AFTER INSERT OR DELETE ON responses
  FOR EACH ROW
  EXECUTE FUNCTION update_survey_response_count();
  
  -- Enable Row Level Security
  ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
  
  -- Create RLS policies
  CREATE POLICY "Survey owners can view responses" 
    ON responses FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM surveys 
        WHERE id = survey_id AND created_by = auth.uid()
      )
    );
    
  CREATE POLICY "Admins can view all responses" 
    ON responses FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Anyone can insert responses to published surveys" 
    ON responses FOR INSERT 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM surveys 
        WHERE id = survey_id 
        AND status = 'published'
        AND (expires_at IS NULL OR expires_at > NOW())
      )
    );
    
  CREATE POLICY "Admins can delete responses" 
    ON responses FOR DELETE 
    USING (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to create analyses table
CREATE OR REPLACE FUNCTION create_analyses_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    summary TEXT,
    results JSONB NOT NULL,
    response_count INT DEFAULT 0,
    ai_generated BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  
  -- Create index for survey_id lookup
  CREATE INDEX IF NOT EXISTS idx_analyses_survey_id ON analyses (survey_id);
  
  -- Enable Row Level Security
  ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
  
  -- Create RLS policies
  CREATE POLICY "Survey owners can view analyses" 
    ON analyses FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM surveys 
        WHERE id = survey_id AND created_by = auth.uid()
      )
    );
    
  CREATE POLICY "Admins can view all analyses" 
    ON analyses FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Survey owners can insert analyses" 
    ON analyses FOR INSERT 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM surveys 
        WHERE id = survey_id AND created_by = auth.uid()
      )
    );
    
  CREATE POLICY "Survey owners can update analyses" 
    ON analyses FOR UPDATE 
    USING (
      EXISTS (
        SELECT 1 FROM surveys 
        WHERE id = survey_id AND created_by = auth.uid()
      )
    );
    
  CREATE POLICY "Admins can update all analyses" 
    ON analyses FOR UPDATE 
    USING (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
  CREATE POLICY "Admins can delete analyses" 
    ON analyses FOR DELETE 
    USING (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications table
CREATE OR REPLACE FUNCTION create_notifications_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT FALSE,
    action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  
  -- Create index for user_id lookup
  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
  
  -- Create index for read status
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (user_id, read);
  
  -- Enable Row Level Security
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
  
  -- Create RLS policies
  CREATE POLICY "Users can view their own notifications" 
    ON notifications FOR SELECT 
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can update their own notifications" 
    ON notifications FOR UPDATE 
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can delete their own notifications" 
    ON notifications FOR DELETE 
    USING (auth.uid() = user_id);
    
  CREATE POLICY "Admins can insert notifications" 
    ON notifications FOR INSERT 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get server timestamp
CREATE OR REPLACE FUNCTION get_server_timestamp()
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get table statistics
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS JSONB AS $$
DECLARE
  tables_info JSONB;
BEGIN
  WITH table_stats AS (
    SELECT
      c.relname AS table_name,
      c.reltuples::BIGINT AS row_count,
      pg_size_pretty(pg_relation_size(c.oid)) AS size,
      pg_relation_size(c.oid) AS size_bytes,
      to_char(greatest(pg_stat_get_last_autovacuum_time(c.oid), pg_stat_get_last_vacuum_time(c.oid)), 'YYYY-MM-DD HH24:MI:SS') AS last_vacuum,
      to_char(greatest(pg_stat_get_last_autoanalyze_time(c.oid), pg_stat_get_last_analyze_time(c.oid)), 'YYYY-MM-DD HH24:MI:SS') AS last_analyze
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
  )
  SELECT json_agg(json_build_object(
    'name', table_name,
    'count', row_count,
    'size', size,
    'size_bytes', size_bytes,
    'last_vacuum', last_vacuum,
    'last_analyze', last_analyze
  )) INTO tables_info
  FROM table_stats;
  
  RETURN COALESCE(tables_info, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql; 