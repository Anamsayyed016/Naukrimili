-- PostgreSQL Database Schema for Resume Management System
-- Designed for efficient JSONB storage, versioning, and high-performance querying
-- Compatible with the Resume API endpoints and ResumeData schema

-- ============================================================================
-- EXTENSIONS AND SETUP
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- USER MANAGEMENT TABLES
-- ============================================================================

-- Users table (if not already exists in your auth system)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255),
    profile_picture_url TEXT,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_subscription_tier_check CHECK (subscription_tier IN ('free', 'premium', 'enterprise'))
);

-- User preferences for resume management
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    default_resume_template VARCHAR(50) DEFAULT 'modern',
    default_export_format VARCHAR(10) DEFAULT 'pdf',
    ai_assistance_enabled BOOLEAN DEFAULT true,
    auto_save_enabled BOOLEAN DEFAULT true,
    privacy_settings JSONB DEFAULT '{"profile_visibility": "private", "resume_sharing": false}',
    notification_settings JSONB DEFAULT '{"email_updates": true, "analysis_alerts": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- ============================================================================
-- RESUME CORE TABLES
-- ============================================================================

-- Main resumes table with JSONB data storage
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Resume metadata
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled Resume',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    visibility VARCHAR(20) NOT NULL DEFAULT 'private',
    
    -- Core resume data stored as JSONB
    data JSONB NOT NULL,
    
    -- AI analysis and metadata
    analysis_data JSONB DEFAULT '{}',
    ats_score INTEGER DEFAULT 0,
    completeness_score INTEGER DEFAULT 0,
    
    -- Template and formatting
    template_name VARCHAR(50) DEFAULT 'modern',
    theme_settings JSONB DEFAULT '{"color": "blue", "layout": "single-column"}',
    
    -- File associations
    original_filename VARCHAR(255),
    upload_file_type VARCHAR(10),
    upload_confidence_score INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_analyzed_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Version tracking
    version_number INTEGER DEFAULT 1,
    is_current_version BOOLEAN DEFAULT true,
    parent_resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT resumes_status_check CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
    CONSTRAINT resumes_visibility_check CHECK (visibility IN ('private', 'public', 'shared')),
    CONSTRAINT resumes_ats_score_check CHECK (ats_score >= 0 AND ats_score <= 100),
    CONSTRAINT resumes_completeness_score_check CHECK (completeness_score >= 0 AND completeness_score <= 100),
    CONSTRAINT resumes_upload_confidence_check CHECK (upload_confidence_score IS NULL OR (upload_confidence_score >= 0 AND upload_confidence_score <= 100)),
    CONSTRAINT resumes_version_number_check CHECK (version_number > 0)
);

-- Resume version history for complete audit trail
CREATE TABLE resume_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    
    -- Snapshot of resume data at this version
    data JSONB NOT NULL,
    analysis_data JSONB DEFAULT '{}',
    
    -- Change tracking
    change_summary TEXT,
    changed_fields TEXT[],
    change_type VARCHAR(20) DEFAULT 'manual',
    
    -- Version metadata
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT resume_versions_change_type_check CHECK (change_type IN ('manual', 'ai_enhancement', 'import', 'template_change')),
    UNIQUE(resume_id, version_number)
);

-- ============================================================================
-- ANALYSIS AND AI TRACKING
-- ============================================================================

-- AI analysis history for tracking improvements over time
CREATE TABLE resume_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    
    -- Analysis results
    completeness_score INTEGER NOT NULL,
    ats_score INTEGER NOT NULL,
    analysis_data JSONB NOT NULL,
    
    -- Analysis metadata
    analysis_type VARCHAR(50) DEFAULT 'standard',
    job_description_hash VARCHAR(64), -- For job-specific analysis
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT resume_analyses_completeness_check CHECK (completeness_score >= 0 AND completeness_score <= 100),
    CONSTRAINT resume_analyses_ats_check CHECK (ats_score >= 0 AND ats_score <= 100),
    CONSTRAINT resume_analyses_type_check CHECK (analysis_type IN ('standard', 'job_specific', 'competitive', 'industry_focused'))
);

-- AI suggestions and recommendations tracking
CREATE TABLE ai_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES resume_analyses(id) ON DELETE CASCADE,
    
    -- Suggestion details
    suggestion_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority INTEGER DEFAULT 3,
    
    -- Implementation tracking
    status VARCHAR(20) DEFAULT 'pending',
    applied_at TIMESTAMP WITH TIME ZONE,
    applied_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- AI metadata
    confidence_score DECIMAL(4,3),
    ai_model_version VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT ai_suggestions_priority_check CHECK (priority >= 1 AND priority <= 5),
    CONSTRAINT ai_suggestions_status_check CHECK (status IN ('pending', 'applied', 'dismissed', 'expired')),
    CONSTRAINT ai_suggestions_confidence_check CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1))
);

-- ============================================================================
-- SHARING AND COLLABORATION
-- ============================================================================

-- Resume sharing for collaboration and feedback
CREATE TABLE resume_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Sharing configuration
    share_token VARCHAR(255) UNIQUE NOT NULL,
    share_type VARCHAR(20) NOT NULL DEFAULT 'view',
    password_protected BOOLEAN DEFAULT false,
    password_hash VARCHAR(255),
    
    -- Access control
    allowed_emails TEXT[],
    max_views INTEGER,
    current_views INTEGER DEFAULT 0,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT resume_shares_share_type_check CHECK (share_type IN ('view', 'comment', 'edit')),
    CONSTRAINT resume_shares_max_views_check CHECK (max_views IS NULL OR max_views > 0),
    CONSTRAINT resume_shares_current_views_check CHECK (current_views >= 0)
);

-- Track resume share access logs
CREATE TABLE resume_share_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    share_id UUID NOT NULL REFERENCES resume_shares(id) ON DELETE CASCADE,
    
    -- Access details
    accessed_by_email VARCHAR(255),
    accessed_by_ip INET,
    user_agent TEXT,
    access_type VARCHAR(20) DEFAULT 'view',
    
    -- Timestamp
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT resume_share_logs_access_type_check CHECK (access_type IN ('view', 'download', 'edit', 'comment'))
);

-- ============================================================================
-- EXPORT AND FILE MANAGEMENT
-- ============================================================================

-- Track resume exports for analytics and limits
CREATE TABLE resume_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Export details
    export_format VARCHAR(10) NOT NULL,
    template_used VARCHAR(50),
    customizations JSONB DEFAULT '{}',
    
    -- File information
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    download_url TEXT,
    
    -- Status and tracking
    status VARCHAR(20) DEFAULT 'completed',
    download_count INTEGER DEFAULT 0,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT resume_exports_format_check CHECK (export_format IN ('pdf', 'docx', 'json', 'txt', 'html')),
    CONSTRAINT resume_exports_status_check CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
    CONSTRAINT resume_exports_file_size_check CHECK (file_size IS NULL OR file_size > 0),
    CONSTRAINT resume_exports_download_count_check CHECK (download_count >= 0)
);

-- ============================================================================
-- SEARCH AND INDEXING OPTIMIZATION
-- ============================================================================

-- Full-text search index for resume content
CREATE TABLE resume_search_index (
    resume_id UUID PRIMARY KEY REFERENCES resumes(id) ON DELETE CASCADE,
    
    -- Searchable text fields extracted from JSONB
    full_name_search TEXT,
    skills_search TEXT,
    experience_search TEXT,
    education_search TEXT,
    summary_search TEXT,
    all_content_search TEXT,
    
    -- Search vectors for full-text search
    search_vector TSVECTOR,
    
    -- Timestamps
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Full-text search index
    CONSTRAINT resume_search_index_vectors_not_null CHECK (search_vector IS NOT NULL)
);

-- ============================================================================
-- USAGE ANALYTICS AND METRICS
-- ============================================================================

-- User activity tracking for analytics
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB DEFAULT '{}',
    
    -- Session and device info
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT user_activity_logs_activity_type_check CHECK (activity_type IN (
        'resume_created', 'resume_updated', 'resume_analyzed', 'resume_exported',
        'ai_suggestion_applied', 'template_changed', 'resume_shared', 'resume_viewed'
    ))
);

-- Usage statistics aggregation table
CREATE TABLE usage_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Date for aggregation
    date DATE NOT NULL,
    
    -- Usage counters
    resumes_created INTEGER DEFAULT 0,
    resumes_updated INTEGER DEFAULT 0,
    analyses_performed INTEGER DEFAULT 0,
    exports_generated INTEGER DEFAULT 0,
    ai_suggestions_applied INTEGER DEFAULT 0,
    
    -- API usage
    api_calls_made INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id, date),
    CONSTRAINT usage_statistics_counters_check CHECK (
        resumes_created >= 0 AND resumes_updated >= 0 AND analyses_performed >= 0 AND 
        exports_generated >= 0 AND ai_suggestions_applied >= 0 AND api_calls_made >= 0
    )
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Primary performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_status ON resumes(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_updated_at ON resumes(updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_user_status ON resumes(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_user_updated ON resumes(user_id, updated_at DESC);

-- JSONB indexes for efficient querying of resume data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_data_gin ON resumes USING GIN (data);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_fullname ON resumes USING GIN ((data->>'fullName') gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_email ON resumes USING GIN ((data->'contact'->>'email') gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_skills ON resumes USING GIN ((data->'skills'));

-- Analysis and performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_ats_score ON resumes(ats_score DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_completeness ON resumes(completeness_score DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_analysis_data ON resumes USING GIN (analysis_data);

-- Version and history indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_versions_resume_id ON resume_versions(resume_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_versions_created_at ON resume_versions(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_analyses_resume_id ON resume_analyses(resume_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_analyses_created_at ON resume_analyses(created_at DESC);

-- Search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_search_vector ON resume_search_index USING GIN (search_vector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_search_fullname ON resume_search_index USING GIN (full_name_search gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_search_skills ON resume_search_index USING GIN (skills_search gin_trgm_ops);

-- Activity and analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_logs_activity_type ON user_activity_logs(activity_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_statistics_user_date ON usage_statistics(user_id, date);

-- Sharing and export indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_shares_token ON resume_shares(share_token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_shares_resume_id ON resume_shares(resume_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_exports_user_id ON resume_exports(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_exports_created_at ON resume_exports(created_at DESC);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at 
    BEFORE UPDATE ON resumes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_statistics_updated_at 
    BEFORE UPDATE ON usage_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to maintain search index
CREATE OR REPLACE FUNCTION update_resume_search_index()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract searchable text from JSONB data
    INSERT INTO resume_search_index (
        resume_id,
        full_name_search,
        skills_search,
        experience_search,
        education_search,
        summary_search,
        all_content_search,
        search_vector
    ) VALUES (
        NEW.id,
        NEW.data->>'fullName',
        array_to_string(ARRAY(SELECT jsonb_array_elements_text(NEW.data->'skills')), ' '),
        (SELECT string_agg(
            (exp->>'jobTitle') || ' ' || 
            (exp->>'company') || ' ' || 
            array_to_string(ARRAY(SELECT jsonb_array_elements_text(exp->'responsibilities')), ' '),
            ' '
        ) FROM jsonb_array_elements(NEW.data->'workExperience') exp),
        (SELECT string_agg(
            (edu->>'degree') || ' ' || 
            (edu->>'institution') || ' ' || 
            COALESCE(edu->>'details', ''),
            ' '
        ) FROM jsonb_array_elements(NEW.data->'education') edu),
        NEW.data->>'summary',
        NEW.data::text,
        to_tsvector('english', 
            COALESCE(NEW.data->>'fullName', '') || ' ' ||
            COALESCE(NEW.data->>'summary', '') || ' ' ||
            NEW.data::text
        )
    )
    ON CONFLICT (resume_id) DO UPDATE SET
        full_name_search = EXCLUDED.full_name_search,
        skills_search = EXCLUDED.skills_search,
        experience_search = EXCLUDED.experience_search,
        education_search = EXCLUDED.education_search,
        summary_search = EXCLUDED.summary_search,
        all_content_search = EXCLUDED.all_content_search,
        search_vector = EXCLUDED.search_vector,
        indexed_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to maintain search index
CREATE TRIGGER maintain_resume_search_index
    AFTER INSERT OR UPDATE OF data ON resumes
    FOR EACH ROW EXECUTE FUNCTION update_resume_search_index();

-- Function to create resume version on update
CREATE OR REPLACE FUNCTION create_resume_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create version if data actually changed
    IF OLD.data IS DISTINCT FROM NEW.data THEN
        INSERT INTO resume_versions (
            resume_id,
            version_number,
            data,
            analysis_data,
            change_summary,
            changed_fields,
            change_type,
            created_by
        ) VALUES (
            OLD.id,
            OLD.version_number,
            OLD.data,
            OLD.analysis_data,
            'Automatic version created on update',
            NULL, -- Could be enhanced to detect specific changed fields
            'manual',
            NEW.user_id -- Assuming user_id represents who made the change
        );
        
        -- Increment version number
        NEW.version_number = OLD.version_number + 1;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for automatic versioning
CREATE TRIGGER create_resume_version_on_update
    BEFORE UPDATE OF data ON resumes
    FOR EACH ROW EXECUTE FUNCTION create_resume_version();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for resume summaries with user info
CREATE VIEW resume_summaries AS
SELECT 
    r.id,
    r.user_id,
    u.email as user_email,
    u.full_name as user_full_name,
    r.title,
    r.status,
    r.data->>'fullName' as resume_full_name,
    r.data->'contact'->>'email' as resume_email,
    r.ats_score,
    r.completeness_score,
    r.template_name,
    r.created_at,
    r.updated_at,
    r.version_number,
    array_length(ARRAY(SELECT jsonb_array_elements_text(r.data->'skills')), 1) as skills_count,
    array_length(ARRAY(SELECT jsonb_array_elements(r.data->'workExperience')), 1) as experience_count
FROM resumes r
JOIN users u ON r.user_id = u.id
WHERE r.status != 'deleted';

-- View for recent resume activity
CREATE VIEW recent_resume_activity AS
SELECT 
    r.id as resume_id,
    r.title as resume_title,
    r.data->>'fullName' as full_name,
    r.updated_at,
    r.status,
    u.email as user_email,
    u.full_name as user_name,
    CASE 
        WHEN r.updated_at > NOW() - INTERVAL '1 hour' THEN 'Recently Updated'
        WHEN r.updated_at > NOW() - INTERVAL '1 day' THEN 'Updated Today'
        WHEN r.updated_at > NOW() - INTERVAL '7 days' THEN 'Updated This Week'
        ELSE 'Older'
    END as activity_period
FROM resumes r
JOIN users u ON r.user_id = u.id
WHERE r.status IN ('draft', 'published')
ORDER BY r.updated_at DESC;

-- ============================================================================
-- PERFORMANCE AND MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to clean up expired exports
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM resume_exports 
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND status != 'completed';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Function to archive old resume versions
CREATE OR REPLACE FUNCTION archive_old_versions(keep_versions INTEGER DEFAULT 10)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH versions_to_delete AS (
        SELECT id
        FROM resume_versions rv
        WHERE NOT EXISTS (
            SELECT 1 
            FROM (
                SELECT id, 
                       ROW_NUMBER() OVER (PARTITION BY resume_id ORDER BY version_number DESC) as rn
                FROM resume_versions 
                WHERE resume_id = rv.resume_id
            ) recent
            WHERE recent.id = rv.id AND recent.rn <= keep_versions
        )
    )
    DELETE FROM resume_versions 
    WHERE id IN (SELECT id FROM versions_to_delete);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- ============================================================================
-- SAMPLE DATA AND TESTING QUERIES
-- ============================================================================

-- Sample user for testing
INSERT INTO users (id, email, full_name, subscription_tier) 
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Test User', 'premium')
ON CONFLICT (email) DO NOTHING;

-- Sample user preferences
INSERT INTO user_preferences (user_id, default_resume_template, ai_assistance_enabled)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'modern', true)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- SECURITY AND ACCESS CONTROL
-- ============================================================================

-- Row Level Security (RLS) policies
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy for users to only access their own resumes
CREATE POLICY user_resumes_policy ON resumes
    FOR ALL TO authenticated_users
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Policy for resume versions
CREATE POLICY user_resume_versions_policy ON resume_versions
    FOR ALL TO authenticated_users
    USING (EXISTS (
        SELECT 1 FROM resumes r 
        WHERE r.id = resume_versions.resume_id 
        AND r.user_id = current_setting('app.current_user_id')::UUID
    ));

-- Grant permissions (adjust role names as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO resume_api_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO resume_api_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO resume_api_user;
