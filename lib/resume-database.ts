import { Pool, PoolClient } from 'pg';
import { 
  ResumeData, 
  ResumeRecord, 
  ResumeAnalysisResponse,
  APIError 
} from './resume-api-types';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20'),
  idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '10000'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export class ResumeDatabase {
  
  // Get a database client with user context
  private async getClient(userId?: string): Promise<PoolClient> {
    const client = await pool.connect();
    
    // Set user context for Row Level Security
    if (userId) {
      await client.query('SET app.current_user_id = $1', [userId]);
    }
    
    return client;
  }

  // Save a new resume
  async saveResume(userId: string, data: ResumeData, metadata?: any): Promise<ResumeRecord> {
    const client = await this.getClient(userId);
    
    try {
      await client.query('BEGIN');
      
      // Insert main resume record
      const resumeResult = await client.query(`
        INSERT INTO resumes (
          user_id, 
          data, 
          title,
          original_filename,
          upload_file_type,
          upload_confidence_score
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        userId,
        JSON.stringify(data),
        data.fullName || 'Untitled Resume',
        metadata?.uploadedFileName,
        metadata?.fileType,
        metadata?.processingConfidence
      ]);

      const resume = resumeResult.rows[0];

      // Create initial version record
      await client.query(`
        INSERT INTO resume_versions (
          resume_id,
          version_number,
          data,
          change_summary,
          change_type
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        resume.id,
        1,
        JSON.stringify(data),
        'Initial resume creation',
        metadata?.fileType ? 'import' : 'manual'
      ]);

      await client.query('COMMIT');

      return this.mapToResumeRecord(resume);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get resume by ID
  async getResume(id: string, userId: string): Promise<ResumeRecord | null> {
    const client = await this.getClient(userId);
    
    try {
      const result = await client.query(`
        SELECT r.*, 
               array_agg(
                 json_build_object(
                   'version', rv.version_number,
                   'data', rv.data,
                   'timestamp', rv.created_at,
                   'changeNotes', rv.change_summary
                 ) ORDER BY rv.version_number DESC
               ) as versions
        FROM resumes r
        LEFT JOIN resume_versions rv ON r.id = rv.resume_id
        WHERE r.id = $1 AND r.status != 'deleted'
        GROUP BY r.id
      `, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapToResumeRecord(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // Update resume with versioning
  async updateResume(
    id: string, 
    userId: string, 
    data: ResumeData, 
    changeNotes?: string
  ): Promise<ResumeRecord> {
    const client = await this.getClient(userId);
    
    try {
      await client.query('BEGIN');

      // Get current resume for version creation
      const currentResult = await client.query(`
        SELECT * FROM resumes WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (currentResult.rows.length === 0) {
        throw new Error('Resume not found');
      }

      const currentResume = currentResult.rows[0];

      // Update main resume record
      const updateResult = await client.query(`
        UPDATE resumes 
        SET 
          data = $1,
          title = $2,
          updated_at = CURRENT_TIMESTAMP,
          version_number = version_number + 1
        WHERE id = $3 AND user_id = $4
        RETURNING *
      `, [
        JSON.stringify(data),
        data.fullName || currentResume.title,
        id,
        userId
      ]);

      const updatedResume = updateResult.rows[0];

      // Create new version record
      await client.query(`
        INSERT INTO resume_versions (
          resume_id,
          version_number,
          data,
          change_summary,
          change_type,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        id,
        updatedResume.version_number,
        JSON.stringify(data),
        changeNotes || 'Resume updated',
        'manual',
        userId
      ]);

      await client.query('COMMIT');

      return this.mapToResumeRecord(updatedResume);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Save analysis results
  async saveAnalysis(
    resumeId: string, 
    userId: string, 
    analysis: ResumeAnalysisResponse['analysis']
  ): Promise<void> {
    const client = await this.getClient(userId);
    
    try {
      await client.query('BEGIN');

      // Update resume with analysis data
      await client.query(`
        UPDATE resumes 
        SET 
          analysis_data = $1,
          ats_score = $2,
          completeness_score = $3,
          last_analyzed_at = CURRENT_TIMESTAMP
        WHERE id = $4 AND user_id = $5
      `, [
        JSON.stringify(analysis),
        analysis.atsScore,
        analysis.completeness,
        resumeId,
        userId
      ]);

      // Get current version number
      const versionResult = await client.query(`
        SELECT version_number FROM resumes WHERE id = $1
      `, [resumeId]);

      const versionNumber = versionResult.rows[0]?.version_number || 1;

      // Insert analysis record
      await client.query(`
        INSERT INTO resume_analyses (
          resume_id,
          version_number,
          completeness_score,
          ats_score,
          analysis_data
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        resumeId,
        versionNumber,
        analysis.completeness,
        analysis.atsScore,
        JSON.stringify(analysis)
      ]);

      // Save AI suggestions
      for (const suggestion of analysis.suggestions) {
        await client.query(`
          INSERT INTO ai_suggestions (
            resume_id,
            suggestion_type,
            category,
            title,
            description,
            priority
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          resumeId,
          'improvement',
          'general',
          suggestion,
          suggestion,
          3
        ]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // List user resumes with pagination
  async listResumes(userId: string, options: {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
    status?: string;
  }) {
    const client = await this.getClient(userId);
    
    try {
      const offset = (options.page - 1) * options.limit;
      const statusFilter = options.status ? 'AND status = $6' : '';
      const params = [userId, options.limit, offset, options.sortBy, options.sortOrder];
      
      if (options.status) {
        params.push(options.status);
      }

      // Get resumes with pagination
      const resumesResult = await client.query(`
        SELECT 
          id,
          title,
          status,
          data->>'fullName' as full_name,
          data->'contact'->>'email' as email,
          ats_score,
          completeness_score,
          template_name,
          created_at,
          updated_at,
          version_number
        FROM resumes 
        WHERE user_id = $1 AND status != 'deleted' ${statusFilter}
        ORDER BY ${options.sortBy} ${options.sortOrder.toUpperCase()}
        LIMIT $2 OFFSET $3
      `, params.slice(0, params.length - (options.status ? 0 : 1)));

      // Get total count
      const countResult = await client.query(`
        SELECT COUNT(*) as total
        FROM resumes 
        WHERE user_id = $1 AND status != 'deleted' ${statusFilter}
      `, options.status ? [userId, options.status] : [userId]);

      return {
        data: resumesResult.rows,
        total: parseInt(countResult.rows[0].total),
      };
    } finally {
      client.release();
    }
  }

  // Search resumes by content
  async searchResumes(userId: string, searchQuery: string, options: {
    page: number;
    limit: number;
  }) {
    const client = await this.getClient(userId);
    
    try {
      const offset = (options.page - 1) * options.limit;
      
      const result = await client.query(`
        SELECT 
          r.id,
          r.title,
          r.data->>'fullName' as full_name,
          r.ats_score,
          r.updated_at,
          ts_rank(rsi.search_vector, query) as rank
        FROM resumes r
        JOIN resume_search_index rsi ON r.id = rsi.resume_id
        JOIN plainto_tsquery('english', $2) query ON true
        WHERE r.user_id = $1 
        AND r.status != 'deleted'
        AND rsi.search_vector @@ query
        ORDER BY rank DESC, r.updated_at DESC
        LIMIT $3 OFFSET $4
      `, [userId, searchQuery, options.limit, offset]);

      const countResult = await client.query(`
        SELECT COUNT(*) as total
        FROM resumes r
        JOIN resume_search_index rsi ON r.id = rsi.resume_id
        JOIN plainto_tsquery('english', $2) query ON true
        WHERE r.user_id = $1 
        AND r.status != 'deleted'
        AND rsi.search_vector @@ query
      `, [userId, searchQuery]);

      return {
        data: result.rows,
        total: parseInt(countResult.rows[0].total),
      };
    } finally {
      client.release();
    }
  }

  // Delete resume (soft delete)
  async deleteResume(id: string, userId: string): Promise<boolean> {
    const client = await this.getClient(userId);
    
    try {
      const result = await client.query(`
        UPDATE resumes 
        SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2 AND status != 'deleted'
        RETURNING id
      `, [id, userId]);

      return result.rows.length > 0;
    } finally {
      client.release();
    }
  }

  // Save export record
  async saveExport(
    resumeId: string, 
    userId: string, 
    exportData: {
      format: string;
      filename: string;
      fileSize: number;
      downloadUrl: string;
      expiresAt: Date;
    }
  ): Promise<string> {
    const client = await this.getClient(userId);
    
    try {
      const result = await client.query(`
        INSERT INTO resume_exports (
          resume_id,
          user_id,
          export_format,
          filename,
          file_size,
          download_url,
          expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        resumeId,
        userId,
        exportData.format,
        exportData.filename,
        exportData.fileSize,
        exportData.downloadUrl,
        exportData.expiresAt
      ]);

      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  // Log user activity
  async logActivity(
    userId: string, 
    resumeId: string | null, 
    activityType: string, 
    activityData?: any
  ): Promise<void> {
    const client = await this.getClient();
    
    try {
      await client.query(`
        INSERT INTO user_activity_logs (
          user_id,
          resume_id,
          activity_type,
          activity_data
        )
        VALUES ($1, $2, $3, $4)
      `, [userId, resumeId, activityType, activityData ? JSON.stringify(activityData) : null]);
    } finally {
      client.release();
    }
  }

  // Get analytics data
  async getAnalytics(userId: string, dateRange: { start: Date; end: Date }) {
    const client = await this.getClient(userId);
    
    try {
      // Resume creation trends
      const trendsResult = await client.query(`
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as resumes_created
        FROM resumes 
        WHERE user_id = $1 
        AND created_at BETWEEN $2 AND $3
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date
      `, [userId, dateRange.start, dateRange.end]);

      // Skill frequency analysis
      const skillsResult = await client.query(`
        SELECT 
          skill,
          COUNT(*) as frequency
        FROM resumes,
        LATERAL jsonb_array_elements_text(data->'skills') as skill
        WHERE user_id = $1 
        AND status != 'deleted'
        GROUP BY skill
        ORDER BY frequency DESC
        LIMIT 20
      `, [userId]);

      // ATS score distribution
      const scoresResult = await client.query(`
        SELECT 
          CASE 
            WHEN ats_score >= 90 THEN '90-100'
            WHEN ats_score >= 80 THEN '80-89'
            WHEN ats_score >= 70 THEN '70-79'
            WHEN ats_score >= 60 THEN '60-69'
            ELSE '0-59'
          END as score_range,
          COUNT(*) as count,
          ROUND(AVG(ats_score), 1) as avg_score
        FROM resumes 
        WHERE user_id = $1 AND ats_score > 0
        GROUP BY score_range
        ORDER BY score_range DESC
      `, [userId]);

      return {
        trends: trendsResult.rows,
        topSkills: skillsResult.rows,
        scoreDistribution: scoresResult.rows,
      };
    } finally {
      client.release();
    }
  }

  // Helper method to map database row to ResumeRecord
  private mapToResumeRecord(row: any): ResumeRecord {
    return {
      id: row.id,
      userId: row.user_id,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      metadata: {
        atsScore: row.ats_score || 0,
        completeness: row.completeness_score || 0,
        lastAnalyzed: row.last_analyzed_at || row.created_at,
        analysisHistory: [], // Would need separate query to populate
      },
      versions: row.versions || [{
        version: row.version_number || 1,
        data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
        timestamp: row.created_at,
        changeNotes: 'Initial version',
      }],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Cleanup expired exports
  async cleanupExpiredExports(): Promise<number> {
    const client = await this.getClient();
    
    try {
      const result = await client.query(`
        DELETE FROM resume_exports 
        WHERE expires_at < CURRENT_TIMESTAMP 
        AND status != 'completed'
        RETURNING id
      `);

      return result.rows.length;
    } finally {
      client.release();
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    const client = await this.getClient();
    
    try {
      await client.query('SELECT 1');
      return true;
    } catch {
      return false;
    } finally {
      client.release();
    }
  }
}

// Export singleton instance
export const resumeDB = new ResumeDatabase();

// Pool event handlers for monitoring
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end(() => {
    console.log('PostgreSQL pool has ended');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  pool.end(() => {
    console.log('PostgreSQL pool has ended');
    process.exit(0);
  });
});
